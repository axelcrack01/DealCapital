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
 IF p_enabled IS TRUE AND EXISTS (
   SELECT 1 FROM dealcapital_private.file_retirement_jobs j
   WHERE j.project_id=p_project_id AND j.status='started'
     AND j.started_at>now()-interval '15 minutes'
 ) THEN
   RAISE EXCEPTION 'File removal is already underway; preservation cannot be retroactively applied'
     USING ERRCODE='42501';
 END IF;
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
