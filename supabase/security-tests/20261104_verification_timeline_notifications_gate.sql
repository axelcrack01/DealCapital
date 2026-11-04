-- DealCapital: notification + timeline security regression.
-- Run as privileged maintainer. This gate is non-destructive.
DO $gate$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n
 FROM pg_proc p JOIN pg_namespace s ON s.oid=p.pronamespace
 WHERE s.nspname='public' AND p.proname='dc_verification_timeline'
 AND p.prosecdef
 AND has_function_privilege('authenticated',p.oid,'EXECUTE')
 AND NOT has_function_privilege('anon',p.oid,'EXECUTE');
 IF n<>1 THEN RAISE EXCEPTION 'Timeline RPC privileges incorrect'; END IF;

 SELECT count(*) INTO n
 FROM pg_trigger t
 WHERE t.tgrelid='dealcapital_private.verification_request_events'::regclass
 AND t.tgname='dc_verification_event_notify'
 AND t.tgenabled='O'
 AND NOT t.tgisinternal;
 IF n<>1 THEN RAISE EXCEPTION 'Verification notification trigger missing or disabled'; END IF;

 SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace
 WHERE s.nspname='dealcapital_private'
 AND c.relname IN ('verification_requests','verification_request_events') AND c.relrowsecurity;
 IF n<>2 THEN RAISE EXCEPTION 'Verification private RLS gate failed'; END IF;

 SELECT count(*) INTO n FROM information_schema.role_table_grants
 WHERE table_schema='dealcapital_private'
 AND table_name IN ('verification_requests','verification_request_events')
 AND grantee IN ('anon','authenticated');
 IF n<>0 THEN RAISE EXCEPTION 'Verification private table direct grants detected'; END IF;

 SELECT count(*) INTO n FROM pg_policies
 WHERE schemaname='public' AND tablename='notificaciones'
 AND cmd='SELECT' AND qual LIKE '%auth.uid()%';
 IF n<1 THEN RAISE EXCEPTION 'User-owned notification read policy missing'; END IF;

 RAISE NOTICE 'Verification notification + timeline catalog gate passed';
END $gate$;
-- Actual lifecycle test executed separately using request-scoped simulated claims.
-- It verifies four distinct alerts (create, observe, respond, close), ordered
-- audit events, non-owner isolation and transaction rollback; it is NOT a
-- signed-JWT HTTP test. Never test with real customer document contents.
