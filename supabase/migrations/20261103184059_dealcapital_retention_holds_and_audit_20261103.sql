-- DealCapital retention controls: lawful hold, immutable decision log and
-- strict preservation of rejected project records until cleanup is safe.
-- No existing rejection, deadline, document or project is modified.
-- Retention of the private audit is deliberately NOT assigned an automatic
-- deletion period until an approved legal retention schedule exists.

ALTER TABLE dealcapital_private.project_rejections
  ADD COLUMN IF NOT EXISTS retention_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retention_hold_reason text,
  ADD COLUMN IF NOT EXISTS retention_hold_at timestamptz,
  ADD COLUMN IF NOT EXISTS retention_hold_by uuid;

CREATE TABLE IF NOT EXISTS dealcapital_private.retention_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL,
  rejection_id bigint NOT NULL REFERENCES dealcapital_private.project_rejections(id),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK(action IN (
    'hold_applied','hold_released','content_purged','private_files_retired'
  )),
  reason text NOT NULL CHECK(char_length(btrim(reason)) BETWEEN 20 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dc_retention_events_project_idx
  ON dealcapital_private.retention_events(project_id,created_at DESC);
ALTER TABLE dealcapital_private.retention_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dealcapital_private.retention_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.dc_admin_set_retention_hold(
  p_project_id bigint,p_enabled boolean,p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
DECLARE
 v_actor uuid:=(SELECT auth.uid());
 v_row_id bigint;
 v_old boolean;
BEGIN
 IF v_actor IS NULL OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=v_actor
    AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Administrative legal hold denied' USING ERRCODE='42501'; END IF;
 IF p_project_id IS NULL OR p_project_id<=0 OR p_enabled IS NULL
    OR char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 20 AND 1000
 THEN RAISE EXCEPTION 'Invalid hold request' USING ERRCODE='22023'; END IF;

 SELECT r.id,r.retention_hold INTO v_row_id,v_old
 FROM dealcapital_private.project_rejections r
 WHERE r.project_id=p_project_id AND r.canceled_at IS NULL AND r.purged_at IS NULL
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active rejection unavailable' USING ERRCODE='P0002'; END IF;
 IF v_old IS NOT DISTINCT FROM p_enabled
 THEN RAISE EXCEPTION 'Hold already has requested status' USING ERRCODE='22023'; END IF;

 UPDATE dealcapital_private.project_rejections
 SET retention_hold=p_enabled,retention_hold_reason=btrim(p_reason),
     retention_hold_at=now(),retention_hold_by=v_actor
 WHERE id=v_row_id;

 INSERT INTO dealcapital_private.retention_events(
  project_id,rejection_id,actor_id,action,reason
 ) VALUES (p_project_id,v_row_id,v_actor,
   CASE WHEN p_enabled THEN 'hold_applied' ELSE 'hold_released' END,
   btrim(p_reason));
 RETURN pg_catalog.jsonb_build_object(
   'project_id',p_project_id,'retention_hold',p_enabled,
   'status',CASE WHEN p_enabled THEN 'preserved' ELSE 'eligible_at_deadline' END
 );
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_set_retention_hold(bigint,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_set_retention_hold(bigint,boolean,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.dc_admin_retention_holds()
RETURNS TABLE (
 project_id bigint,retention_hold boolean,retention_hold_reason text,
 retention_hold_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=(SELECT auth.uid())
  AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Administrative hold list denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT r.project_id,r.retention_hold,r.retention_hold_reason,r.retention_hold_at
 FROM dealcapital_private.project_rejections r
 WHERE r.canceled_at IS NULL AND r.purged_at IS NULL
 ORDER BY r.rejected_at DESC LIMIT 200;
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_retention_holds() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_retention_holds() TO authenticated;

-- Rejected content must not be edited by its owner to hide references that
-- would otherwise block cleanup. Trusted maintenance acts under postgres.
CREATE OR REPLACE FUNCTION public.dc_guard_project_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog,public
AS $dc$
BEGIN
 IF current_user IN ('anon','authenticated') THEN
   IF TG_OP='INSERT' THEN
     NEW.proyecto_verificado:=false;
     NEW.estado:='pendiente';
     NEW.monto_recaudado:=0;
     NEW.porcentaje_financiado:=0;
   ELSIF TG_OP='UPDATE' THEN
     IF OLD.estado='rechazado' THEN
       RAISE EXCEPTION 'Rejected proposals are locked until an administrator restores them'
       USING ERRCODE='42501';
     END IF;
     IF NEW.proyecto_verificado IS DISTINCT FROM OLD.proyecto_verificado
      OR NEW.estado IS DISTINCT FROM OLD.estado
      OR NEW.monto_recaudado IS DISTINCT FROM OLD.monto_recaudado
      OR NEW.porcentaje_financiado IS DISTINCT FROM OLD.porcentaje_financiado THEN
       RAISE EXCEPTION 'State and financial tracking require an authorized process'
       USING ERRCODE='42501';
     END IF;
   END IF;
 END IF;
 RETURN NEW;
END;
$dc$;


-- Include retention hold in queue eligibility without changing its API shape.
CREATE OR REPLACE FUNCTION public.dc_admin_rejection_queue(p_limit integer DEFAULT 100)
RETURNS TABLE(
  project_id bigint,project_title text,category text,explanation text,
  rejected_at timestamptz,delete_after timestamptz,purged_at timestamptz,
  dependencies bigint,has_files boolean,can_purge boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=(SELECT auth.uid())
   AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Administrative queue access denied' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>200 THEN
  RAISE EXCEPTION 'Invalid queue limit' USING ERRCODE='22023'; END IF;

 RETURN QUERY SELECT r.project_id,r.project_title,r.category,r.explanation,
   r.rejected_at,r.delete_after,r.purged_at,
   (SELECT count(*) FROM public.interesados i WHERE i.proyecto_id=r.project_id)
   +(SELECT count(*) FROM public.conversaciones c WHERE c.proyecto_id=r.project_id)
   +(SELECT count(*) FROM public.compromisos c WHERE c.proyecto_id=r.project_id)
   +(SELECT count(*) FROM public.favoritos f WHERE f.proyecto_id=r.project_id)
   +(SELECT count(*) FROM dealcapital_private.project_review_audit a WHERE a.project_id=r.project_id)
   AS dependencies,
   (nullif(btrim(p.documento_pdf),'') IS NOT NULL OR nullif(btrim(p.pitch_deck_url),'') IS NOT NULL
    OR nullif(btrim(p.documentos_url),'') IS NOT NULL OR nullif(btrim(p.logo_url),'') IS NOT NULL
    OR nullif(btrim(p.imagen_url),'') IS NOT NULL) AS has_files,
   (p.id IS NOT NULL
    AND r.retention_hold IS FALSE
    AND p.estado='rechazado'
    AND p.proyecto_verificado IS NOT TRUE
    AND nullif(btrim(p.documento_pdf),'') IS NULL AND nullif(btrim(p.pitch_deck_url),'') IS NULL
    AND nullif(btrim(p.documentos_url),'') IS NULL AND nullif(btrim(p.logo_url),'') IS NULL AND nullif(btrim(p.imagen_url),'') IS NULL
    AND NOT EXISTS(SELECT 1 FROM public.interesados i WHERE i.proyecto_id=r.project_id)
    AND NOT EXISTS(SELECT 1 FROM public.conversaciones c WHERE c.proyecto_id=r.project_id)
    AND NOT EXISTS(SELECT 1 FROM public.compromisos c WHERE c.proyecto_id=r.project_id)
    AND NOT EXISTS(SELECT 1 FROM public.favoritos f WHERE f.proyecto_id=r.project_id)
    AND NOT EXISTS(SELECT 1 FROM dealcapital_private.project_review_audit a WHERE a.project_id=r.project_id)
   ) AS can_purge
 FROM dealcapital_private.project_rejections r
 LEFT JOIN public.proyectos p ON p.id=r.project_id
 WHERE r.canceled_at IS NULL
 ORDER BY r.rejected_at DESC LIMIT p_limit;
END;
$dc$;

-- Maintenance job also records a durable event when content is purged.
CREATE OR REPLACE FUNCTION dealcapital_private.dc_purge_rejected_projects(p_max integer DEFAULT 25)
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog
AS $dc$
DECLARE r record; v_count integer:=0;
BEGIN
 IF current_user<>'postgres' THEN
   RAISE EXCEPTION 'Purge restricted to database maintenance role'
      USING ERRCODE='42501';
 END IF;
 IF p_max IS NULL OR p_max<1 OR p_max>100
 THEN RAISE EXCEPTION 'Invalid batch size' USING ERRCODE='22023'; END IF;

 FOR r IN
 SELECT q.id,q.project_id FROM dealcapital_private.project_rejections q
 WHERE q.canceled_at IS NULL AND q.purged_at IS NULL
   AND q.delete_after<=now() AND q.retention_hold IS FALSE
 ORDER BY q.delete_after,q.id
 FOR UPDATE SKIP LOCKED LIMIT p_max
 LOOP
   -- Lock the parent to serialize with edits and FK child insertions.
   PERFORM 1 FROM public.proyectos p WHERE p.id=r.project_id FOR UPDATE;
   IF NOT FOUND THEN
     -- Keep the rejection record for traceability, even if removed elsewhere.
     UPDATE dealcapital_private.project_rejections SET purged_at=now() WHERE id=r.id;
     CONTINUE;
   END IF;

   DELETE FROM public.proyectos p
   WHERE p.id=r.project_id
     AND p.estado='rechazado'
     AND EXISTS (SELECT 1 FROM dealcapital_private.project_rejections q WHERE q.id=r.id AND q.retention_hold IS FALSE AND q.canceled_at IS NULL)
     AND p.proyecto_verificado IS NOT TRUE
     AND nullif(btrim(p.documento_pdf),'') IS NULL
     AND nullif(btrim(p.pitch_deck_url),'') IS NULL
     AND nullif(btrim(p.documentos_url),'') IS NULL
     AND nullif(btrim(p.logo_url),'') IS NULL
     AND nullif(btrim(p.imagen_url),'') IS NULL
     AND NOT EXISTS(SELECT 1 FROM public.interesados i WHERE i.proyecto_id=p.id)
     AND NOT EXISTS(SELECT 1 FROM public.conversaciones c WHERE c.proyecto_id=p.id)
     AND NOT EXISTS(SELECT 1 FROM public.compromisos c WHERE c.proyecto_id=p.id)
     AND NOT EXISTS(SELECT 1 FROM public.favoritos f WHERE f.proyecto_id=p.id)
     AND NOT EXISTS(SELECT 1 FROM dealcapital_private.project_review_audit a WHERE a.project_id=p.id);
   IF FOUND THEN
     UPDATE dealcapital_private.project_rejections SET purged_at=now() WHERE id=r.id;
     INSERT INTO dealcapital_private.retention_events (project_id,rejection_id,action,reason)
     VALUES (r.project_id,r.id,'content_purged','Vencimiento de plazo y comprobación de ausencia de dependencias');
     v_count:=v_count+1;
   END IF;
 END LOOP;
 RETURN v_count;
END;
$dc$;
