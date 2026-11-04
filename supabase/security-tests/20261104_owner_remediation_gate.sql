-- DealCapital: owner remediation security and schema regression gate.
-- Read-only, no test accounts or records created.
DO $gate$
DECLARE v_count int;
BEGIN
 SELECT count(*) INTO v_count FROM information_schema.columns
 WHERE table_schema='dealcapital_private' AND table_name='verification_requests'
 AND column_name IN ('owner_response','owner_response_at');
 IF v_count<>2 THEN RAISE EXCEPTION 'Response fields missing'; END IF;

 SELECT count(*) INTO v_count FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN
 ('dc_submit_verification_response','dc_verification_responses')
 AND p.prosecdef AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
 AND has_function_privilege('authenticated',p.oid,'EXECUTE');
 IF v_count<>2 THEN RAISE EXCEPTION 'Remediation RPC permissions incorrect'; END IF;

 SELECT count(*) INTO v_count FROM information_schema.role_table_grants
 WHERE table_schema='dealcapital_private'
 AND table_name IN ('verification_requests','verification_request_events')
 AND grantee IN ('anon','authenticated');
 IF v_count<>0 THEN RAISE EXCEPTION 'Private review tables have browser role grants'; END IF;

 RAISE NOTICE 'Owner remediation regression gate passed';
END $gate$;

-- Functional negative test evidence, run separately in a rollback-only
-- transaction: owner can answer an observed request; a different user
-- cannot answer or read it; the administrator can read its latest response;
-- status moves to en_revision and an immutable audit row is appended.
-- This SQL checks catalog privileges, not signed JWT network behavior.
