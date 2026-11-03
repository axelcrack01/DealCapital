-- DealCapital: prohibit repeated active proposals, not only rapid double-submits.
-- Existing historical duplicates are preserved for administrator review.
-- The same owner may submit again only if no active proposal with identical
-- normalized title and requested amount remains (e.g. prior one rejected).

CREATE OR REPLACE FUNCTION dealcapital_private.dc_block_rapid_duplicate_projects()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog
AS $dc$
DECLARE v_norm text; v_key text;
BEGIN
 IF current_user='authenticated' AND (SELECT auth.uid()) IS NOT NULL THEN
  v_norm:=lower(regexp_replace(btrim(NEW.nombre_proyecto),'\s+',' ','g'));
  v_key:=NEW.user_id::text||'|'||v_norm||'|'||NEW.capital_requerido::text;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key,0));
  IF EXISTS(
   SELECT 1 FROM public.proyectos p
   WHERE p.user_id=NEW.user_id
     AND p.capital_requerido=NEW.capital_requerido
     AND lower(regexp_replace(btrim(p.nombre_proyecto),'\s+',' ','g'))=v_norm
     AND p.estado IS DISTINCT FROM 'rechazado'
  ) THEN
    RAISE EXCEPTION
      'Ya existe un expediente activo con el mismo nombre, propietario y monto. Revisa tus proyectos en lugar de reenviar.'
      USING ERRCODE='23505';
  END IF;
 END IF;
 RETURN NEW;
END;
$dc$;
REVOKE ALL ON FUNCTION dealcapital_private.dc_block_rapid_duplicate_projects()
FROM PUBLIC,anon,authenticated;
