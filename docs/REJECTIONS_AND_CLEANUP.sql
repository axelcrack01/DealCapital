-- DealCapital: rejection, traceability and bounded scheduled cleanup.
-- No existing project is rejected or removed by this migration.
-- Retention: 7 days, then hourly purge if and ONLY if dependencies and media
-- are absent. Rejection log remains in a private schema after content deletion.

CREATE TABLE IF NOT EXISTS dealcapital_private.project_rejections (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL,
  owner_id uuid,
  reviewer_id uuid NOT NULL,
  project_title text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'duplicado','informacion_incompleta','datos_inconsistentes',
    'incumplimiento','otro'
  )),
  explanation text NOT NULL CHECK (char_length(btrim(explanation)) BETWEEN 20 AND 1000),
  rejected_at timestamptz NOT NULL DEFAULT now(),
  delete_after timestamptz NOT NULL,
  purged_at timestamptz,
  canceled_at timestamptz,
  canceled_by uuid,
  cancel_reason text
);

CREATE UNIQUE INDEX IF NOT EXISTS dc_active_project_rejection_unique
ON dealcapital_private.project_rejections(project_id)
WHERE canceled_at IS NULL AND purged_at IS NULL;

CREATE INDEX IF NOT EXISTS dc_rejection_delete_queue
ON dealcapital_private.project_rejections(delete_after)
WHERE canceled_at IS NULL AND purged_at IS NULL;

ALTER TABLE dealcapital_private.project_rejections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE dealcapital_private.project_rejections FROM PUBLIC,anon,authenticated;

-- Users can read only non-sensitive rejection details of their own project.
-- This RPC never reveals project contents or other users' rejection records.
CREATE OR REPLACE FUNCTION public.dc_my_rejected_projects()
RETURNS TABLE (
  project_id bigint,
  project_title text,
  category text,
  explanation text,
  rejected_at timestamptz,
  delete_after timestamptz,
  purged_at timestamptz,
  canceled_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT r.project_id,r.project_title,r.category,r.explanation,
         r.rejected_at,r.delete_after,r.purged_at,r.canceled_at
  FROM dealcapital_private.project_rejections r
  WHERE r.owner_id=(SELECT auth.uid()) AND r.canceled_at IS NULL
  ORDER BY r.rejected_at DESC LIMIT 100;
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_my_rejected_projects() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_my_rejected_projects() TO authenticated;

CREATE OR REPLACE FUNCTION public.dc_admin_reject_project(
  p_project_id bigint,
  p_category text,
  p_explanation text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_title text;
  v_owner uuid;
  v_status text;
  v_visible boolean;
  v_rejection_id bigint;
  v_delete_after timestamptz := now() + interval '7 days';
  v_label text;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id=v_actor
      AND u.raw_app_meta_data->>'role'='admin'
  ) THEN RAISE EXCEPTION 'Administrative rejection denied' USING ERRCODE='42501'; END IF;

  IF p_project_id IS NULL OR p_project_id<=0
     OR coalesce(p_category,'') NOT IN (
       'duplicado','informacion_incompleta','datos_inconsistentes',
       'incumplimiento','otro'
     )
     OR char_length(btrim(coalesce(p_explanation,''))) NOT BETWEEN 20 AND 1000
  THEN RAISE EXCEPTION 'Invalid rejection reason or category' USING ERRCODE='22023'; END IF;

  SELECT p.nombre_proyecto,p.user_id,p.estado,p.proyecto_verificado
    INTO v_title,v_owner,v_status,v_visible
    FROM public.proyectos p WHERE p.id=p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found' USING ERRCODE='P0002'; END IF;
  IF v_visible IS TRUE OR v_status='publicado' THEN
    RAISE EXCEPTION 'Withdraw the publication before rejecting this proposal'
    USING ERRCODE='22023';
  END IF;
  IF v_status IS DISTINCT FROM 'pendiente' THEN
    RAISE EXCEPTION 'Only pending proposals can be rejected' USING ERRCODE='22023';
  END IF;

  UPDATE public.proyectos
    SET estado='rechazado',proyecto_verificado=false
  WHERE id=p_project_id;

  INSERT INTO dealcapital_private.project_rejections(
     project_id,owner_id,reviewer_id,project_title,category,
     explanation,delete_after
  ) VALUES (p_project_id,v_owner,v_actor,v_title,p_category,
            btrim(p_explanation),v_delete_after)
  RETURNING id INTO v_rejection_id;

  v_label:=CASE p_category
    WHEN 'duplicado' THEN 'Propuesta duplicada'
    WHEN 'informacion_incompleta' THEN 'Información incompleta'
    WHEN 'datos_inconsistentes' THEN 'Datos inconsistentes'
    WHEN 'incumplimiento' THEN 'Incumplimiento de condiciones'
    ELSE 'Otros motivos' END;

  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notificaciones(user_id,tipo,mensaje)
    VALUES (v_owner,'Propuesta rechazada',
      'Tu propuesta #'||p_project_id||' fue rechazada. Motivo: '
      ||v_label||'. Explicación: '||btrim(p_explanation)
      ||' Se programó su eliminación a partir de '
      ||to_char(v_delete_after AT TIME ZONE 'America/Lima','DD/MM/YYYY HH24:MI')
      ||' (hora de Perú), siempre que no existan operaciones o documentos asociados.');
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'project_id',p_project_id,'status','rechazado',
    'rejection_id',v_rejection_id,'delete_after',v_delete_after,
    'cleanup_policy','safe_after_7_days'
  );
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_reject_project(bigint,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_reject_project(bigint,text,text) TO authenticated;

-- Undo a rejection before its content is purged (for administrative errors).
CREATE OR REPLACE FUNCTION public.dc_admin_restore_rejected_project(
  p_project_id bigint,p_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
DECLARE v_actor uuid:=(SELECT auth.uid()); v_owner uuid; v_row bigint;
BEGIN
 IF v_actor IS NULL OR NOT EXISTS (
   SELECT 1 FROM auth.users u WHERE u.id=v_actor
    AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Administrative restore denied' USING ERRCODE='42501'; END IF;
 IF char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 20 AND 1000
 THEN RAISE EXCEPTION 'Restore reason must have 20-1000 characters' USING ERRCODE='22023'; END IF;

 SELECT r.id,r.owner_id INTO v_row,v_owner
 FROM dealcapital_private.project_rejections r
 WHERE r.project_id=p_project_id
  AND r.canceled_at IS NULL AND r.purged_at IS NULL
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active rejection not found' USING ERRCODE='P0002'; END IF;

 UPDATE public.proyectos SET estado='pendiente',proyecto_verificado=false
 WHERE id=p_project_id AND estado='rechazado';
 IF NOT FOUND THEN RAISE EXCEPTION 'Proposal cannot be restored' USING ERRCODE='22023'; END IF;

 UPDATE dealcapital_private.project_rejections
 SET canceled_at=now(), canceled_by=v_actor, cancel_reason=btrim(p_reason)
 WHERE id=v_row;

 IF v_owner IS NOT NULL THEN
  INSERT INTO public.notificaciones(user_id,tipo,mensaje)
  VALUES(v_owner,'Rechazo anulado',
  'Se anuló el rechazo de la propuesta #'||p_project_id||
  '. Ahora vuelve a estar pendiente de revisión.');
 END IF;
 RETURN pg_catalog.jsonb_build_object('project_id',p_project_id,'status','pendiente','restored',true);
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_restore_rejected_project(bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_restore_rejected_project(bigint,text) TO authenticated;

-- Administrative queue with dependency counts and cleanup eligibility.
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
REVOKE ALL ON FUNCTION public.dc_admin_rejection_queue(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_rejection_queue(integer) TO authenticated;

-- No direct API access; job runs with postgres and avoids cascading related data.
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
   AND q.delete_after<=now()
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
     v_count:=v_count+1;
   END IF;
 END LOOP;
 RETURN v_count;
END;
$dc$;
REVOKE ALL ON FUNCTION dealcapital_private.dc_purge_rejected_projects(integer)
FROM PUBLIC,anon,authenticated;

-- Protect against rapid duplicate submissions, including concurrent requests.
-- Existing duplicate rows are NOT modified by this migration.
CREATE OR REPLACE FUNCTION dealcapital_private.dc_block_rapid_duplicate_projects()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog
AS $dc$
DECLARE v_norm text; v_key text;
BEGIN
 IF current_user='authenticated' AND (SELECT auth.uid()) IS NOT NULL
 THEN
  v_norm:=lower(regexp_replace(btrim(NEW.nombre_proyecto),'\s+',' ','g'));
  v_key:=NEW.user_id::text||'|'||v_norm||'|'||NEW.capital_requerido::text;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key,0));
  IF EXISTS(
   SELECT 1 FROM public.proyectos p
   WHERE p.user_id=NEW.user_id
    AND p.capital_requerido=NEW.capital_requerido
    AND lower(regexp_replace(btrim(p.nombre_proyecto),'\s+',' ','g'))=v_norm
    AND p.created_at>=now()-interval '1 hour'
    AND p.estado IS DISTINCT FROM 'rechazado'
  ) THEN
    RAISE EXCEPTION 'Ya enviaste una propuesta idéntica recientemente. Revisa tus proyectos antes de reenviar.'
    USING ERRCODE='23505';
  END IF;
 END IF;
 RETURN NEW;
END;
$dc$;

DROP TRIGGER IF EXISTS dc_block_rapid_duplicate_projects ON public.proyectos;
CREATE TRIGGER dc_block_rapid_duplicate_projects BEFORE INSERT ON public.proyectos
FOR EACH ROW EXECUTE FUNCTION dealcapital_private.dc_block_rapid_duplicate_projects();
REVOKE ALL ON FUNCTION dealcapital_private.dc_block_rapid_duplicate_projects()
FROM PUBLIC,anon,authenticated;

-- Prevent administrative approval from bypassing the active rejection queue.
CREATE OR REPLACE FUNCTION public.dc_admin_review_project(
  p_project_id bigint,
  p_publish boolean,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor uuid;
  v_old_published boolean;
  v_old_status text;
  v_new_status text;
  v_audit_id bigint;
BEGIN
  v_actor := (SELECT auth.uid());
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u
     WHERE u.id = v_actor
       AND u.raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrative review is not authorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_project_id IS NULL OR p_publish IS NULL
     OR char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 20 AND 1000 THEN
    RAISE EXCEPTION 'Invalid review parameters; provide a reason (20–1000 characters)'
      USING ERRCODE = '22023';
  END IF;

  SELECT p.proyecto_verificado, p.estado
    INTO v_old_published, v_old_status
    FROM public.proyectos p
   WHERE p.id = p_project_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
  END IF;
  -- Rejected proposals can only return through the audited restore flow.
  IF v_old_status = 'rechazado' THEN
    RAISE EXCEPTION 'A rejected proposal must be restored before approval'
      USING ERRCODE = '42501';
  END IF;
  IF coalesce(v_old_published,false) = p_publish THEN
    RAISE EXCEPTION 'Project already has this publication state'
      USING ERRCODE = '22023';
  END IF;

  v_new_status := CASE WHEN p_publish THEN 'publicado' ELSE 'pendiente' END;

  UPDATE public.proyectos
     SET proyecto_verificado = p_publish, estado = v_new_status
   WHERE id = p_project_id;

  INSERT INTO dealcapital_private.project_review_audit(
    project_id, actor_id, old_published, new_published,
    old_status, new_status, reason
  ) VALUES (
    p_project_id, v_actor, v_old_published, p_publish,
    v_old_status, v_new_status, btrim(p_reason)
  ) RETURNING id INTO v_audit_id;

  RETURN pg_catalog.jsonb_build_object(
    'project_id', p_project_id,
    'published', p_publish,
    'status', v_new_status,
    'audit_id', v_audit_id
  );
END;
$$;
