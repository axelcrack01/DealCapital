-- A rejected proposal's owner can see whether deletion is legally held.
-- Reasons for internal preservation are available only in Admin.
CREATE OR REPLACE FUNCTION public.dc_my_retention_holds()
RETURNS TABLE(project_id bigint,retention_hold boolean,retention_hold_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN
   RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT r.project_id,r.retention_hold,r.retention_hold_at
 FROM dealcapital_private.project_rejections r
 WHERE r.owner_id=(SELECT auth.uid()) AND r.canceled_at IS NULL
 ORDER BY r.rejected_at DESC LIMIT 100;
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_my_retention_holds() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_my_retention_holds() TO authenticated;
