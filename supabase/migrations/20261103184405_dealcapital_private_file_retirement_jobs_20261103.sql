-- DealCapital — admin-controlled private PDF retirement
-- Distinct storage API deletion and database confirmation stages.
-- No project or file is deleted by applying this migration.
-- Only service_role may request or complete jobs; the Edge Function
-- verifies the caller against auth.users.app_metadata before doing so.

CREATE TABLE IF NOT EXISTS dealcapital_private.file_retirement_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rejection_id bigint NOT NULL REFERENCES dealcapital_private.project_rejections(id),
  project_id bigint NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  document_key text,
  pitch_key text,
  status text NOT NULL DEFAULT 'started' CHECK(status IN ('started','completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE dealcapital_private.file_retirement_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE dealcapital_private.file_retirement_jobs FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS dc_file_retirement_jobs_project_idx
 ON dealcapital_private.file_retirement_jobs(project_id,started_at DESC);

CREATE OR REPLACE FUNCTION public.dc_service_begin_file_retirement(
 p_project_id bigint,p_actor_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
DECLARE
 v_rej bigint;
 v_owner uuid;
 v_document text;
 v_pitch text;
 v_doc_exists boolean:=false;
 v_pitch_exists boolean:=false;
 v_job uuid;
 v_files jsonb:='[]'::jsonb;
BEGIN
 -- EXECUTE is granted exclusively to service_role. SECURITY DEFINER
 -- runs with the function owner's role, so current_user is not the caller.

 IF p_project_id IS NULL OR p_project_id<=0 OR p_actor_id IS NULL
 OR NOT EXISTS(
   SELECT 1 FROM auth.users u WHERE u.id=p_actor_id
     AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Authorized administrator required' USING ERRCODE='42501'; END IF;

 SELECT r.id INTO v_rej
 FROM dealcapital_private.project_rejections r
 WHERE r.project_id=p_project_id
  AND r.canceled_at IS NULL AND r.purged_at IS NULL
  AND r.retention_hold IS FALSE
  AND r.delete_after<=now()
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Retention deadline not reached, legal hold active, or rejection missing' USING ERRCODE='22023'; END IF;

 SELECT p.user_id,p.documento_pdf,p.pitch_deck_url
 INTO v_owner,v_document,v_pitch
 FROM public.proyectos p
 WHERE p.id=p_project_id
  AND p.estado='rechazado' AND p.proyecto_verificado IS NOT TRUE
  AND nullif(btrim(p.documentos_url),'') IS NULL
  AND nullif(btrim(p.logo_url),'') IS NULL
  AND nullif(btrim(p.imagen_url),'') IS NULL
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Project is not safely eligible for private-file retirement' USING ERRCODE='22023'; END IF;
 IF v_owner IS NULL THEN
  RAISE EXCEPTION 'Legacy project without owner requires manual review' USING ERRCODE='22023'; END IF;

 IF EXISTS(SELECT 1 FROM public.interesados i WHERE i.proyecto_id=p_project_id)
 OR EXISTS(SELECT 1 FROM public.conversaciones c WHERE c.proyecto_id=p_project_id)
 OR EXISTS(SELECT 1 FROM public.compromisos c WHERE c.proyecto_id=p_project_id)
 OR EXISTS(SELECT 1 FROM public.favoritos f WHERE f.proyecto_id=p_project_id)
 OR EXISTS(SELECT 1 FROM dealcapital_private.project_review_audit a WHERE a.project_id=p_project_id)
 THEN RAISE EXCEPTION 'Linked business records must be resolved and preserved first' USING ERRCODE='22023'; END IF;

 IF EXISTS(SELECT 1 FROM dealcapital_private.file_retirement_jobs j
   WHERE j.project_id=p_project_id AND j.status='started'
   AND j.started_at>now()-interval '5 minutes')
 THEN RAISE EXCEPTION 'A document retirement is already processing' USING ERRCODE='22023'; END IF;

 v_document:=nullif(btrim(v_document),'');
 v_pitch:=nullif(btrim(v_pitch),'');
 IF v_document IS NULL AND v_pitch IS NULL THEN
  RAISE EXCEPTION 'There are no private PDF references to retire' USING ERRCODE='22023'; END IF;

 -- Only canonical uploaded PDFs belonging to this exact owner are eligible.
 -- Malformed, external or legacy URLs require manual data review.
 IF v_document IS NOT NULL THEN
  IF v_document !~ ('^'||v_owner::text||'-[0-9a-fA-F-]{36}\.pdf$')
   OR EXISTS(SELECT 1 FROM public.proyectos other
      WHERE other.id<>p_project_id AND
       (other.documento_pdf=v_document OR other.pitch_deck_url=v_document))
  THEN RAISE EXCEPTION 'Document reference is noncanonical or shared' USING ERRCODE='22023'; END IF;
  SELECT EXISTS(SELECT 1 FROM storage.objects o
    WHERE o.bucket_id='Documentos' AND o.name=v_document
      AND o.owner_id=v_owner::text) INTO v_doc_exists;
  IF EXISTS(SELECT 1 FROM storage.objects o
    WHERE o.bucket_id='Documentos' AND o.name=v_document AND o.owner_id IS DISTINCT FROM v_owner::text)
  THEN RAISE EXCEPTION 'Document object ownership mismatch' USING ERRCODE='22023'; END IF;
  v_files:=v_files||pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object('bucket','Documentos','path',v_document,'exists',v_doc_exists));
 END IF;
 IF v_pitch IS NOT NULL THEN
  IF v_pitch !~ ('^'||v_owner::text||'-[0-9a-fA-F-]{36}\.pdf$')
   OR EXISTS(SELECT 1 FROM public.proyectos other
      WHERE other.id<>p_project_id AND
       (other.documento_pdf=v_pitch OR other.pitch_deck_url=v_pitch))
  THEN RAISE EXCEPTION 'Pitch document reference is noncanonical or shared' USING ERRCODE='22023'; END IF;
  SELECT EXISTS(SELECT 1 FROM storage.objects o
    WHERE o.bucket_id='pitch-decks' AND o.name=v_pitch
      AND o.owner_id=v_owner::text) INTO v_pitch_exists;
  IF EXISTS(SELECT 1 FROM storage.objects o
    WHERE o.bucket_id='pitch-decks' AND o.name=v_pitch AND o.owner_id IS DISTINCT FROM v_owner::text)
  THEN RAISE EXCEPTION 'Pitch object ownership mismatch' USING ERRCODE='22023'; END IF;
  v_files:=v_files||pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object('bucket','pitch-decks','path',v_pitch,'exists',v_pitch_exists));
 END IF;

 INSERT INTO dealcapital_private.file_retirement_jobs(
  rejection_id,project_id,actor_id,document_key,pitch_key
 ) VALUES (v_rej,p_project_id,p_actor_id,v_document,v_pitch)
 RETURNING id INTO v_job;

 RETURN pg_catalog.jsonb_build_object(
  'job_id',v_job,'project_id',p_project_id,'files',v_files
 );
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_service_begin_file_retirement(bigint,uuid)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dc_service_begin_file_retirement(bigint,uuid)
TO service_role;

CREATE OR REPLACE FUNCTION public.dc_service_finish_file_retirement(
 p_job_id uuid,p_actor_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
DECLARE
 v_job record;
 v_current_doc text;
 v_current_pitch text;
BEGIN
 -- EXECUTE is granted exclusively to service_role. SECURITY DEFINER
 -- runs with the function owner's role, so current_user is not the caller.

 IF p_job_id IS NULL OR p_actor_id IS NULL OR NOT EXISTS(
  SELECT 1 FROM auth.users u WHERE u.id=p_actor_id
  AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Authorized administrator required' USING ERRCODE='42501'; END IF;

 SELECT j.* INTO v_job FROM dealcapital_private.file_retirement_jobs j
 WHERE j.id=p_job_id AND j.actor_id=p_actor_id AND j.status='started'
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active disposal job not found' USING ERRCODE='P0002'; END IF;

 PERFORM 1 FROM dealcapital_private.project_rejections r
 WHERE r.id=v_job.rejection_id AND r.project_id=v_job.project_id
   AND r.canceled_at IS NULL AND r.purged_at IS NULL
   AND r.retention_hold IS FALSE AND r.delete_after<=now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rejection no longer eligible for disposal' USING ERRCODE='22023'; END IF;

 SELECT p.documento_pdf,p.pitch_deck_url INTO v_current_doc,v_current_pitch
 FROM public.proyectos p WHERE p.id=v_job.project_id
  AND p.estado='rechazado' AND p.proyecto_verificado IS NOT TRUE
  AND nullif(btrim(p.documentos_url),'') IS NULL
  AND nullif(btrim(p.logo_url),'') IS NULL
  AND nullif(btrim(p.imagen_url),'') IS NULL
  FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Project not eligible for file retirement' USING ERRCODE='22023'; END IF;
 IF nullif(btrim(v_current_doc),'') IS DISTINCT FROM v_job.document_key
    OR nullif(btrim(v_current_pitch),'') IS DISTINCT FROM v_job.pitch_key THEN
  RAISE EXCEPTION 'Project file references changed during disposal' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.interesados i WHERE i.proyecto_id=v_job.project_id)
 OR EXISTS(SELECT 1 FROM public.conversaciones c WHERE c.proyecto_id=v_job.project_id)
 OR EXISTS(SELECT 1 FROM public.compromisos c WHERE c.proyecto_id=v_job.project_id)
 OR EXISTS(SELECT 1 FROM public.favoritos f WHERE f.proyecto_id=v_job.project_id)
 OR EXISTS(SELECT 1 FROM dealcapital_private.project_review_audit a WHERE a.project_id=v_job.project_id)
 THEN RAISE EXCEPTION 'Project dependencies appeared during disposal' USING ERRCODE='22023'; END IF;

 -- The Storage API must remove the physical objects BEFORE clearing refs.
 IF (v_job.document_key IS NOT NULL AND EXISTS(
   SELECT 1 FROM storage.objects WHERE bucket_id='Documentos' AND name=v_job.document_key))
 OR (v_job.pitch_key IS NOT NULL AND EXISTS(
   SELECT 1 FROM storage.objects WHERE bucket_id='pitch-decks' AND name=v_job.pitch_key))
 THEN RAISE EXCEPTION 'One or more Storage objects still exist' USING ERRCODE='22023'; END IF;

 UPDATE public.proyectos SET documento_pdf=NULL,pitch_deck_url=NULL
 WHERE id=v_job.project_id;
 UPDATE dealcapital_private.file_retirement_jobs
 SET status='completed',completed_at=now() WHERE id=p_job_id;
 INSERT INTO dealcapital_private.retention_events(
   project_id,rejection_id,actor_id,action,reason
 ) VALUES (v_job.project_id,v_job.rejection_id,p_actor_id,'private_files_retired',
   'Retiro controlado de referencias PDF tras eliminación física confirmada por Storage');
 RETURN pg_catalog.jsonb_build_object(
   'project_id',v_job.project_id,'status','private_files_retired',
   'files_count',((v_job.document_key IS NOT NULL)::int+(v_job.pitch_key IS NOT NULL)::int)
 );
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_service_finish_file_retirement(uuid,uuid)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dc_service_finish_file_retirement(uuid,uuid)
TO service_role;
