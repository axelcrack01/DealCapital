-- DealCapital v5.9 - Verification event timeline and transactional in-app notifications.
-- Keeps private audit records in dealcapital_private and exposes only authorized RPC reads.
CREATE INDEX IF NOT EXISTS dc_verification_events_timeline_idx
 ON dealcapital_private.verification_request_events(request_id,created_at DESC,id DESC);

CREATE OR REPLACE FUNCTION public.dc_verification_timeline(
 p_request_id bigint DEFAULT NULL,
 p_limit integer DEFAULT 300
)
RETURNS TABLE (
 event_id bigint,
 request_id bigint,
 event_type text,
 previous_status text,
 new_status text,
 note text,
 actor_kind text,
 created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_uid uuid := (SELECT auth.uid()); v_admin boolean;
BEGIN
 IF v_uid IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
 END IF;
 SELECT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=v_uid AND u.raw_app_meta_data->>'role'='admin'
 ) INTO v_admin;
 RETURN QUERY
 SELECT e.id,e.request_id,e.event_type,e.previous_status,e.new_status,e.note,
        CASE WHEN e.actor_id=r.owner_id THEN 'emprendedor'::text ELSE 'administrador'::text END,
        e.created_at
 FROM dealcapital_private.verification_request_events e
 JOIN dealcapital_private.verification_requests r ON r.id=e.request_id
 WHERE (r.owner_id=v_uid OR v_admin)
   AND (p_request_id IS NULL OR e.request_id=p_request_id)
 ORDER BY e.created_at DESC,e.id DESC
 LIMIT least(greatest(coalesce(p_limit,300),1),500);
END; $$;

REVOKE ALL ON FUNCTION public.dc_verification_timeline(bigint,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_verification_timeline(bigint,integer) TO authenticated;

CREATE OR REPLACE FUNCTION dealcapital_private.dc_notify_verification_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_owner uuid; v_recipient uuid; v_label text; v_message text;
BEGIN
 SELECT r.owner_id INTO v_owner
 FROM dealcapital_private.verification_requests r WHERE r.id=NEW.request_id;
 IF v_owner IS NULL THEN RETURN NEW; END IF;

 IF NEW.event_type='created' THEN
  v_label:='Nueva solicitud de revisión';
  v_message:='Se recibió la solicitud de verificación #'||NEW.request_id||'. Revísala en el panel administrativo.';
 ELSIF NEW.actor_id=v_owner THEN
  v_label:='Subsanación recibida';
  v_message:='El emprendedor respondió a la observación de la solicitud #'||NEW.request_id||'.';
 ELSE
  v_label:=CASE NEW.new_status
   WHEN 'observada' THEN 'Solicitud observada'
   WHEN 'cerrada' THEN 'Revisión cerrada'
   ELSE 'Solicitud en revisión' END;
  v_message:=CASE NEW.new_status
   WHEN 'observada' THEN 'Tu solicitud #'||NEW.request_id||' tiene observaciones. Consulta los detalles en tu expediente.'
   WHEN 'cerrada' THEN 'La revisión administrativa de tu solicitud #'||NEW.request_id||' fue cerrada. Esto no acredita identidad oficial.'
   ELSE 'Tu solicitud #'||NEW.request_id||' está en revisión administrativa.' END;
 END IF;

 IF NEW.event_type='created' OR NEW.actor_id=v_owner THEN
  FOR v_recipient IN
   SELECT u.id FROM auth.users u
   WHERE u.raw_app_meta_data->>'role'='admin'
  LOOP
   IF v_recipient IS DISTINCT FROM NEW.actor_id THEN
    INSERT INTO public.notificaciones(user_id,tipo,mensaje)
    VALUES(v_recipient,v_label,v_message);
   END IF;
  END LOOP;
 ELSE
  INSERT INTO public.notificaciones(user_id,tipo,mensaje)
  VALUES(v_owner,v_label,v_message);
 END IF;
 RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS dc_verification_event_notify ON dealcapital_private.verification_request_events;
CREATE TRIGGER dc_verification_event_notify
 AFTER INSERT ON dealcapital_private.verification_request_events
 FOR EACH ROW EXECUTE FUNCTION dealcapital_private.dc_notify_verification_event();
