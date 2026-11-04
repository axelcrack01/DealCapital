ALTER TABLE dealcapital_private.verification_requests
 ADD COLUMN IF NOT EXISTS owner_response text,
 ADD COLUMN IF NOT EXISTS owner_response_at timestamptz;

CREATE OR REPLACE FUNCTION public.dc_submit_verification_response(p_request_id bigint,p_response text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_uid uuid := auth.uid(); v_status text; v_attempts integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_response IS NULL OR length(btrim(p_response))<20 OR length(btrim(p_response))>1000
 THEN RAISE EXCEPTION 'Response must have 20-1000 characters' USING ERRCODE='22023'; END IF;
 SELECT r.status INTO v_status
 FROM dealcapital_private.verification_requests r
 WHERE r.id=p_request_id AND r.owner_id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable' USING ERRCODE='42501'; END IF;
 IF v_status<>'observada' THEN
  RAISE EXCEPTION 'Only observed requests can be answered' USING ERRCODE='22023';
 END IF;
 SELECT count(*) INTO v_attempts
 FROM dealcapital_private.verification_request_events e
 WHERE e.request_id=p_request_id AND e.actor_id=v_uid AND e.event_type='status_changed'
   AND e.previous_status='observada' AND e.new_status='en_revision';
 IF v_attempts>=5 THEN RAISE EXCEPTION 'Maximum of five response cycles reached' USING ERRCODE='22023'; END IF;
 UPDATE dealcapital_private.verification_requests
 SET status='en_revision', owner_response=btrim(p_response), owner_response_at=now(), updated_at=now()
 WHERE id=p_request_id;
 INSERT INTO dealcapital_private.verification_request_events
 (request_id,actor_id,event_type,previous_status,new_status,note)
 VALUES(p_request_id,v_uid,'status_changed','observada','en_revision',btrim(p_response));
END; $$;

CREATE OR REPLACE FUNCTION public.dc_verification_responses(p_limit integer DEFAULT 100)
RETURNS TABLE(request_id bigint, owner_response text, owner_response_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_uid uuid := auth.uid(); v_admin boolean;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=v_uid AND u.raw_app_meta_data->>'role'='admin') INTO v_admin;
 RETURN QUERY
 SELECT r.id,r.owner_response,r.owner_response_at
 FROM dealcapital_private.verification_requests r
 WHERE r.owner_response IS NOT NULL AND (r.owner_id=v_uid OR v_admin)
 ORDER BY r.owner_response_at DESC
 LIMIT least(greatest(coalesce(p_limit,100),1),100);
END; $$;

REVOKE ALL ON FUNCTION public.dc_submit_verification_response(bigint,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.dc_verification_responses(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_submit_verification_response(bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dc_verification_responses(integer) TO authenticated;