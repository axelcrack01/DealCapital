CREATE OR REPLACE FUNCTION public.dc_admin_restore_rejected_project(
  p_project_id bigint,p_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $dc$
DECLARE v_actor uuid:=(SELECT auth.uid()); v_owner uuid; v_row bigint; v_hold boolean;
BEGIN
 IF v_actor IS NULL OR NOT EXISTS (
   SELECT 1 FROM auth.users u WHERE u.id=v_actor
    AND u.raw_app_meta_data->>'role'='admin'
 ) THEN RAISE EXCEPTION 'Administrative restore denied' USING ERRCODE='42501'; END IF;
 IF char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 20 AND 1000
 THEN RAISE EXCEPTION 'Restore reason must have 20-1000 characters' USING ERRCODE='22023'; END IF;

 SELECT r.id,r.owner_id,r.retention_hold INTO v_row,v_owner,v_hold
 FROM dealcapital_private.project_rejections r
 WHERE r.project_id=p_project_id
  AND r.canceled_at IS NULL AND r.purged_at IS NULL
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active rejection not found' USING ERRCODE='P0002'; END IF;
 IF v_hold IS TRUE THEN
  RAISE EXCEPTION 'Release the retention hold before restoring a rejected proposal'
  USING ERRCODE='42501';
 END IF;

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
