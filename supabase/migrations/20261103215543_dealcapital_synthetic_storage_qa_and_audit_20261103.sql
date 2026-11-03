-- DealCapital Admin QA: physically test upload/read/delete of a synthetic PDF
-- in its own private Storage bucket. The QA log is private and does not
-- grant any client permissions to change business documents or project rows.
-- No user documents or existing project data are touched by this migration.

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('dealcapital-qa','dealcapital-qa',false,65536,ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM storage.buckets
  WHERE id='dealcapital-qa' AND public=false AND file_size_limit=65536
  AND allowed_mime_types=ARRAY['application/pdf']::text[]
 ) THEN
  RAISE EXCEPTION 'Synthetic QA bucket already exists with unsafe configuration';
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS dealcapital_private.storage_qa_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'started'
    CHECK (status IN ('started','passed','failed')),
  uploaded boolean NOT NULL DEFAULT false,
  downloaded_verified boolean NOT NULL DEFAULT false,
  deleted_verified boolean NOT NULL DEFAULT false,
  error_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CONSTRAINT dc_qa_event_integrity CHECK (
    (status='started' AND finished_at IS NULL) OR
    (status IN ('passed','failed') AND finished_at IS NOT NULL)
  ),
  CONSTRAINT dc_qa_pass_integrity CHECK (
    status <> 'passed' OR
    (uploaded AND downloaded_verified AND deleted_verified AND error_code IS NULL)
  )
);
ALTER TABLE dealcapital_private.storage_qa_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE dealcapital_private.storage_qa_runs FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS dc_storage_qa_runs_actor_time
 ON dealcapital_private.storage_qa_runs(actor_id,started_at DESC);

-- A privileged function claims a QA run. Called only by a backend holding
-- service-role credentials AFTER verifying an authenticated administrator.
-- No user-controllable file paths are stored or accepted.
CREATE OR REPLACE FUNCTION public.dc_service_begin_storage_qa(p_actor_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $dc$
DECLARE v_id uuid;
BEGIN
 IF p_actor_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=p_actor_id
    AND u.raw_app_meta_data->>'role'='admin'
    AND (u.banned_until IS NULL OR u.banned_until<=now())
 ) THEN RAISE EXCEPTION 'Trusted admin required' USING ERRCODE='42501'; END IF;

 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor_id::text||':storage_qa',0));
 IF EXISTS(
  SELECT 1 FROM dealcapital_private.storage_qa_runs r
  WHERE r.actor_id=p_actor_id AND r.started_at>now()-interval '60 seconds'
 ) THEN RAISE EXCEPTION 'QA check is rate-limited to once per minute'
   USING ERRCODE='22023'; END IF;

 IF NOT EXISTS (SELECT 1 FROM storage.buckets b
  WHERE b.id='dealcapital-qa' AND b.public IS FALSE
  AND b.allowed_mime_types=ARRAY['application/pdf']::text[]
  AND b.file_size_limit=65536
 ) THEN RAISE EXCEPTION 'QA bucket configuration invalid' USING ERRCODE='22023'; END IF;

 INSERT INTO dealcapital_private.storage_qa_runs(actor_id)
 VALUES(p_actor_id) RETURNING id INTO v_id;
 RETURN v_id;
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_service_begin_storage_qa(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dc_service_begin_storage_qa(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dc_service_finish_storage_qa(
 p_run_id uuid,p_actor_id uuid,p_uploaded boolean,p_downloaded_verified boolean,
 p_deleted_verified boolean,p_error_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $dc$
DECLARE v_pass boolean; v_status text;
BEGIN
 IF p_run_id IS NULL OR p_actor_id IS NULL OR p_uploaded IS NULL
  OR p_downloaded_verified IS NULL OR p_deleted_verified IS NULL
  OR char_length(coalesce(p_error_code,''))>80
 THEN RAISE EXCEPTION 'Invalid QA result' USING ERRCODE='22023'; END IF;

 v_pass:=p_uploaded AND p_downloaded_verified AND p_deleted_verified
         AND p_error_code IS NULL;
 v_status:=CASE WHEN v_pass THEN 'passed' ELSE 'failed' END;
 UPDATE dealcapital_private.storage_qa_runs r
 SET status=v_status,uploaded=p_uploaded,downloaded_verified=p_downloaded_verified,
 deleted_verified=p_deleted_verified,error_code=p_error_code,finished_at=now()
 WHERE r.id=p_run_id AND r.actor_id=p_actor_id AND r.status='started';

 IF NOT FOUND THEN RAISE EXCEPTION 'QA run not found or already finished'
 USING ERRCODE='P0002'; END IF;
 RETURN pg_catalog.jsonb_build_object('run_id',p_run_id,'status',v_status);
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_service_finish_storage_qa(
 uuid,uuid,boolean,boolean,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dc_service_finish_storage_qa(
 uuid,uuid,boolean,boolean,boolean,text) TO service_role;

CREATE OR REPLACE FUNCTION public.dc_admin_storage_qa_history(p_limit integer DEFAULT 10)
RETURNS TABLE(
 id uuid,status text,uploaded boolean,downloaded_verified boolean,
 deleted_verified boolean,error_code text,started_at timestamptz,finished_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $dc$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(
  SELECT 1 FROM auth.users u WHERE u.id=(SELECT auth.uid())
  AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Admin access denied' USING ERRCODE='42501'; END IF;

 IF p_limit IS NULL OR p_limit<1 OR p_limit>30 THEN
 RAISE EXCEPTION 'Invalid limit' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT r.id,r.status,r.uploaded,r.downloaded_verified,
   r.deleted_verified,r.error_code,r.started_at,r.finished_at
 FROM dealcapital_private.storage_qa_runs r
 ORDER BY r.started_at DESC LIMIT p_limit;
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_storage_qa_history(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_storage_qa_history(integer) TO authenticated;
