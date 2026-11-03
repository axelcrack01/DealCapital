-- Administrative read-only access to audit of document-retention actions.
-- Events remain in a private schema and are not writable from the browser.
CREATE OR REPLACE FUNCTION public.dc_admin_retention_events(p_limit integer DEFAULT 30)
RETURNS TABLE(
  id bigint,project_id bigint,actor_id uuid,action text,reason text,created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
   SELECT 1 FROM auth.users u WHERE u.id=(SELECT auth.uid())
   AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Administrative retention history denied' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>200
 THEN RAISE EXCEPTION 'Invalid history limit' USING ERRCODE='22023'; END IF;
 RETURN QUERY
 SELECT e.id,e.project_id,e.actor_id,e.action,e.reason,e.created_at
 FROM dealcapital_private.retention_events e
 ORDER BY e.created_at DESC,e.id DESC LIMIT p_limit;
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_retention_events(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_retention_events(integer) TO authenticated;
