-- DealCapital administrative review, audited and restricted to trusted Auth app_metadata.
-- This migration does NOT provision any administrator or change existing projects.
-- Only accounts explicitly assigned app_metadata.role = 'admin' by authorized
-- Auth administrators will be able to call these functions.
--
-- The legacy profiles.rol field is NEVER treated as an authority.

CREATE SCHEMA IF NOT EXISTS dealcapital_private;
REVOKE ALL ON SCHEMA dealcapital_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS dealcapital_private.project_review_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES public.proyectos(id),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  old_published boolean,
  new_published boolean NOT NULL,
  old_status text,
  new_status text NOT NULL,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 20 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE dealcapital_private.project_review_audit FROM PUBLIC, anon, authenticated;
ALTER TABLE dealcapital_private.project_review_audit ENABLE ROW LEVEL SECURITY;

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
REVOKE ALL ON FUNCTION public.dc_admin_review_project(bigint,boolean,text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_review_project(bigint,boolean,text)
TO authenticated;

-- Read a limited list of audit events; this function never returns project
-- documents, identification material, or financial records.
CREATE OR REPLACE FUNCTION public.dc_admin_review_history(p_limit integer DEFAULT 25)
RETURNS TABLE (
  id bigint, project_id bigint, actor_id uuid, old_published boolean,
  new_published boolean, reason text, reviewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor uuid;
BEGIN
  v_actor := (SELECT auth.uid());
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = v_actor
      AND u.raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrative audit access is not authorized'
      USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Invalid history limit' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT a.id, a.project_id, a.actor_id, a.old_published,
         a.new_published, a.reason, a.created_at
  FROM dealcapital_private.project_review_audit a
  ORDER BY a.created_at DESC, a.id DESC
  LIMIT p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.dc_admin_review_history(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_review_history(integer) TO authenticated;
