-- DealCapital P2.2 — Project column privacy and trusted notifications.
-- 2026-11-03. No existing data is deleted or backfilled.
--
-- PostgreSQL column grants protect all published rows, including queries
-- through the Data API and authenticated accounts. No direct SELECT of
-- email or document storage keys is granted to anon/authenticated.

REVOKE SELECT ON TABLE public.proyectos FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, nombre_proyecto, emprendedor, capital_requerido, descripcion,
  retorno_ofrecido, estado, created_at, industria, plazo, ubicacion,
  pagina_web, user_id, monto_recaudado, riesgo, roi_estimado,
  video_pitch, proyecciones, riesgos, equipo_fundador,
  proyecto_verificado, porcentaje_financiado, logo_url, imagen_url
) ON TABLE public.proyectos TO anon, authenticated;

-- Narrow, auditable administrative access to private storage references.
-- This RPC returns *object keys only*, never signed URLs or raw PDF data.
CREATE OR REPLACE FUNCTION public.dc_admin_project_document_keys(p_project_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $dc$
DECLARE
  v_pdf text;
  v_deck text;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrative document access denied' USING ERRCODE = '42501';
  END IF;
  IF p_project_id IS NULL OR p_project_id <= 0 THEN
    RAISE EXCEPTION 'Invalid project' USING ERRCODE = '22023';
  END IF;

  SELECT p.documento_pdf, p.pitch_deck_url
    INTO v_pdf, v_deck
    FROM public.proyectos p
    WHERE p.id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN pg_catalog.jsonb_build_object(
    'documento_pdf', v_pdf, 'pitch_deck_url', v_deck
  );
END;
$dc$;
REVOKE ALL ON FUNCTION public.dc_admin_project_document_keys(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dc_admin_project_document_keys(bigint) TO authenticated;

-- Clients may mark only their own notifications as read, not rewrite
-- the recipient, type, message or timestamps.
REVOKE UPDATE ON TABLE public.notificaciones FROM PUBLIC, anon, authenticated;
GRANT UPDATE (leida) ON TABLE public.notificaciones TO authenticated;

-- Remove the arbitrary-recipient notification insertion endpoint.
DROP POLICY IF EXISTS "Usuarios logueados crean notificaciones" ON public.notificaciones;
REVOKE INSERT ON TABLE public.notificaciones FROM PUBLIC, anon, authenticated;

-- Notifications are now generated transactionally by validated source
-- operations, never by untrusted client-supplied user_id or message text.
CREATE OR REPLACE FUNCTION dealcapital_private.dc_notify_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $dc$
DECLARE v_owner uuid;
BEGIN
  SELECT p.user_id INTO v_owner FROM public.proyectos p
  WHERE p.id = NEW.proyecto_id AND p.proyecto_verificado IS TRUE;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM NEW.inversionista_id THEN
    INSERT INTO public.notificaciones(user_id,tipo,mensaje)
    VALUES (v_owner, 'Nuevo interesado',
            'Un inversionista mostró interés en uno de tus proyectos.');
  END IF;
  RETURN NEW;
END;
$dc$;

CREATE OR REPLACE FUNCTION dealcapital_private.dc_notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $dc$
DECLARE v_recipient uuid;
BEGIN
  SELECT CASE
    WHEN c.emprendedor_id = NEW.sender_id THEN c.inversionista_id
    WHEN c.inversionista_id = NEW.sender_id THEN c.emprendedor_id
    ELSE NULL END
  INTO v_recipient
  FROM public.conversaciones c
  WHERE c.id = NEW.conversacion_id;
  IF v_recipient IS NOT NULL AND v_recipient IS DISTINCT FROM NEW.sender_id THEN
    INSERT INTO public.notificaciones(user_id,tipo,mensaje)
    VALUES (v_recipient,'Nuevo mensaje',
            'Tienes un nuevo mensaje en DealCapital.');
  END IF;
  RETURN NEW;
END;
$dc$;

-- Protect immutable ownership/amount fields before owner review.
CREATE OR REPLACE FUNCTION dealcapital_private.dc_guard_commitment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $dc$
BEGIN
  IF current_user IN ('anon','authenticated') THEN
    IF (NEW.proyecto_id, NEW.inversionista_id, NEW.monto,
        NEW.mensaje, NEW.created_at)
       IS DISTINCT FROM
       (OLD.proyecto_id, OLD.inversionista_id, OLD.monto,
        OLD.mensaje, OLD.created_at) THEN
      RAISE EXCEPTION 'Commitment ownership and amount are immutable'
        USING ERRCODE='42501';
    END IF;
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
      IF OLD.estado IS DISTINCT FROM 'pendiente'
         OR NEW.estado IS NULL
         OR NEW.estado NOT IN ('aceptado','rechazado') THEN
        RAISE EXCEPTION 'Invalid commitment transition' USING ERRCODE='42501';
      END IF;
      NEW.aprobado_at := CASE WHEN NEW.estado='aceptado' THEN now() ELSE NULL END;
      NEW.rechazado_at := CASE WHEN NEW.estado='rechazado' THEN now() ELSE NULL END;
    ELSIF NEW.aprobado_at IS DISTINCT FROM OLD.aprobado_at
       OR NEW.rechazado_at IS DISTINCT FROM OLD.rechazado_at THEN
      RAISE EXCEPTION 'Commitment timestamps cannot be edited directly'
        USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$dc$;

CREATE OR REPLACE FUNCTION dealcapital_private.dc_notify_commitment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $dc$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado
     AND NEW.estado IN ('aceptado','rechazado')
     AND NEW.inversionista_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.proyectos p
       WHERE p.id = NEW.proyecto_id
         AND p.user_id = (SELECT auth.uid())
     ) THEN
    INSERT INTO public.notificaciones(user_id,tipo,mensaje)
    VALUES (NEW.inversionista_id,
            CASE WHEN NEW.estado='aceptado' THEN 'Compromiso aceptado'
                 ELSE 'Compromiso rechazado' END,
            CASE WHEN NEW.estado='aceptado'
                 THEN 'Tu compromiso de inversión fue aceptado.'
                 ELSE 'Tu compromiso de inversión fue rechazado.' END);
  END IF;
  RETURN NEW;
END;
$dc$;

DROP TRIGGER IF EXISTS dc_notify_interest ON public.interesados;
CREATE TRIGGER dc_notify_interest AFTER INSERT ON public.interesados
FOR EACH ROW EXECUTE FUNCTION dealcapital_private.dc_notify_interest();

DROP TRIGGER IF EXISTS dc_notify_message ON public.mensajes;
CREATE TRIGGER dc_notify_message AFTER INSERT ON public.mensajes
FOR EACH ROW EXECUTE FUNCTION dealcapital_private.dc_notify_message();

DROP TRIGGER IF EXISTS dc_guard_commitment_update ON public.compromisos;
CREATE TRIGGER dc_guard_commitment_update BEFORE UPDATE ON public.compromisos
FOR EACH ROW EXECUTE FUNCTION dealcapital_private.dc_guard_commitment_update();

DROP TRIGGER IF EXISTS dc_notify_commitment ON public.compromisos;
CREATE TRIGGER dc_notify_commitment AFTER UPDATE ON public.compromisos
FOR EACH ROW EXECUTE FUNCTION dealcapital_private.dc_notify_commitment();

REVOKE ALL ON FUNCTION dealcapital_private.dc_notify_interest() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION dealcapital_private.dc_notify_message() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION dealcapital_private.dc_guard_commitment_update() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION dealcapital_private.dc_notify_commitment() FROM PUBLIC,anon,authenticated;
