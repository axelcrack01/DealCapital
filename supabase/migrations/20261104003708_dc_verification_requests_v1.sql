-- DealCapital: preliminary verification review workflow; never represents official KYC.
CREATE TABLE IF NOT EXISTS dealcapital_private.verification_requests (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 request_type text NOT NULL CHECK (request_type IN ('perfil','empresa')),
 status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_revision','observada','cerrada')),
 reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 review_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS dc_verification_one_open_per_type
 ON dealcapital_private.verification_requests(owner_id,request_type)
 WHERE status IN ('pendiente','en_revision','observada');
CREATE INDEX IF NOT EXISTS dc_verification_recent_requests
 ON dealcapital_private.verification_requests(created_at DESC);
ALTER TABLE dealcapital_private.verification_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dealcapital_private.verification_requests FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS dealcapital_private.verification_request_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id bigint NOT NULL REFERENCES dealcapital_private.verification_requests(id) ON DELETE RESTRICT,
 actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 event_type text NOT NULL CHECK (event_type IN ('created','status_changed')),
 previous_status text,
 new_status text NOT NULL,
 note text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dealcapital_private.verification_request_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dealcapital_private.verification_request_events FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS dc_verification_events_by_request
 ON dealcapital_private.verification_request_events(request_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.dc_request_verification(p_type text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $$
DECLARE v_uid uuid:=auth.uid(); v_id bigint; v_today int;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_type IS NULL OR p_type NOT IN ('perfil','empresa') THEN RAISE EXCEPTION 'Unsupported request type' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=v_uid AND tipo_usuario='emprendedor')
 THEN RAISE EXCEPTION 'Entrepreneur profile required' USING ERRCODE='42501'; END IF;
 SELECT count(*) INTO v_today FROM dealcapital_private.verification_requests
 WHERE owner_id=v_uid AND created_at>=now()-interval '24 hours';
 IF v_today>=5 THEN RAISE EXCEPTION 'Daily verification request limit reached' USING ERRCODE='22023'; END IF;
 BEGIN
  INSERT INTO dealcapital_private.verification_requests(owner_id,request_type)
  VALUES(v_uid,p_type) RETURNING id INTO v_id;
 EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'An open request already exists for this category' USING ERRCODE='23505';
 END;
 INSERT INTO dealcapital_private.verification_request_events(request_id,actor_id,event_type,new_status)
 VALUES(v_id,v_uid,'created','pendiente');
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.dc_my_verification_requests()
RETURNS TABLE(id bigint,request_type text,status text,review_note text,created_at timestamptz,updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT r.id,r.request_type,r.status,r.review_note,r.created_at,r.updated_at
 FROM dealcapital_private.verification_requests r WHERE r.owner_id=auth.uid()
 ORDER BY r.created_at DESC LIMIT 50;
END; $$;

CREATE OR REPLACE FUNCTION public.dc_admin_verification_queue(p_limit integer DEFAULT 100)
RETURNS TABLE(id bigint,owner_id uuid,request_type text,status text,review_note text,created_at timestamptz,updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=auth.uid() AND u.raw_app_meta_data->>'role'='admin')
 THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT r.id,r.owner_id,r.request_type,r.status,r.review_note,r.created_at,r.updated_at
 FROM dealcapital_private.verification_requests r ORDER BY r.created_at DESC
 LIMIT least(greatest(coalesce(p_limit,100),1),100);
END; $$;

CREATE OR REPLACE FUNCTION public.dc_admin_review_verification(p_request_id bigint,p_status text,p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_prev text; v_owner uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=auth.uid() AND u.raw_app_meta_data->>'role'='admin')
 THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('en_revision','observada','cerrada')
 THEN RAISE EXCEPTION 'Invalid review status' USING ERRCODE='22023'; END IF;
 IF p_note IS NULL OR length(btrim(p_note))<20 OR length(btrim(p_note))>1000
 THEN RAISE EXCEPTION 'Review note must have 20-1000 characters' USING ERRCODE='22023'; END IF;
 SELECT status,owner_id INTO v_prev,v_owner FROM dealcapital_private.verification_requests
 WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request not found' USING ERRCODE='22023'; END IF;
 IF v_prev='cerrada' OR v_prev=p_status THEN RAISE EXCEPTION 'Invalid or duplicate review transition' USING ERRCODE='22023'; END IF;
 IF v_prev='pendiente' AND p_status NOT IN ('en_revision','observada','cerrada')
 THEN RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023'; END IF;
 IF v_prev='observada' AND p_status NOT IN ('en_revision','cerrada')
 THEN RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023'; END IF;
 UPDATE dealcapital_private.verification_requests SET status=p_status,review_note=btrim(p_note),reviewer_id=auth.uid(),updated_at=now()
 WHERE id=p_request_id;
 INSERT INTO dealcapital_private.verification_request_events(request_id,actor_id,event_type,previous_status,new_status,note)
 VALUES(p_request_id,auth.uid(),'status_changed',v_prev,p_status,btrim(p_note));
END; $$;

REVOKE ALL ON FUNCTION public.dc_request_verification(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.dc_my_verification_requests() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.dc_admin_verification_queue(integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.dc_admin_review_verification(bigint,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dc_request_verification(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dc_my_verification_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dc_admin_verification_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dc_admin_review_verification(bigint,text,text) TO authenticated;
