-- DealCapital: read-only verification workflow production regression gate.
-- Execute as SQL maintainer; does not create or modify rows.
DO $gate$
DECLARE v_check integer;
BEGIN
 SELECT count(*) INTO v_check
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='dealcapital_private'
 AND c.relname IN ('verification_requests','verification_request_events')
 AND c.relrowsecurity;
 IF v_check<>2 THEN RAISE EXCEPTION 'Verification private tables need RLS'; END IF;

 SELECT count(*) INTO v_check FROM information_schema.role_table_grants
 WHERE table_schema='dealcapital_private'
 AND table_name IN ('verification_requests','verification_request_events')
 AND grantee IN ('anon','authenticated');
 IF v_check<>0 THEN RAISE EXCEPTION 'Private verification tables exposed to client roles'; END IF;

 SELECT count(*) INTO v_check FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
 AND p.proname IN (
 'dc_request_verification','dc_my_verification_requests',
 'dc_admin_verification_queue','dc_admin_review_verification'
 ) AND p.prosecdef;
 IF v_check<>4 THEN RAISE EXCEPTION 'Verification RPCs missing or not SECDEF'; END IF;

 SELECT count(*) INTO v_check FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'dc_%verification%'
 AND has_function_privilege('anon',p.oid,'EXECUTE');
 IF v_check<>0 THEN RAISE EXCEPTION 'Anonymous clients can execute verification functions'; END IF;

 RAISE NOTICE 'Verification workflow catalog checks passed';
END $gate$;
