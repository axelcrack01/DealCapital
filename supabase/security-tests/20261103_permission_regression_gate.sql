-- DealCapital / SQL security regression gate (read-only).
-- Run in Supabase SQL Editor after every security-sensitive release.
-- This does not test authenticated role semantics; use separate JWT-based tests.
DO $audit$
DECLARE v_count integer;
BEGIN
 SELECT count(*) INTO v_count FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosecdef
 AND (p.proname LIKE 'dc_admin_%' OR p.proname LIKE 'dc_service_%' OR p.proname LIKE 'dc_my_%')
 AND has_function_privilege('anon',p.oid,'EXECUTE');
 IF v_count>0 THEN RAISE EXCEPTION 'SECURITY GATE: % privileged RPCs executable by anon',v_count; END IF;
 SELECT count(*) INTO v_count FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'dc_service_%'
 AND has_function_privilege('authenticated',p.oid,'EXECUTE');
 IF v_count>0 THEN RAISE EXCEPTION 'SECURITY GATE: % service RPCs executable by authenticated',v_count; END IF;
 SELECT count(*) INTO v_count FROM pg_class c
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity;
 IF v_count>0 THEN RAISE EXCEPTION 'SECURITY GATE: % public tables have RLS disabled',v_count; END IF;
 IF NOT EXISTS (
 SELECT 1 FROM storage.buckets WHERE id='dealcapital-qa'
 AND public=false AND file_size_limit=65536
 AND allowed_mime_types=ARRAY['application/pdf']::text[]
 ) THEN RAISE EXCEPTION 'SECURITY GATE: synthetic QA bucket config mismatch'; END IF;
 RAISE NOTICE 'DealCapital permission regression gate PASSED';
END
$audit$;
