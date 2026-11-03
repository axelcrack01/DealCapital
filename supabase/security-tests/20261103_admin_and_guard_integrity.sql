-- DealCapital v5.4: administrative role and guard integrity.
-- Non-destructive catalog checks. No user records are exposed in result output.
-- Requires execution by a privileged database maintainer in Supabase SQL Editor.
-- This is NOT a substitute for end-to-end tests with valid user JWTs.
DO $audit$
DECLARE v_count integer; v_violations text;
BEGIN
  SELECT count(*) INTO v_count
  FROM auth.users WHERE raw_app_meta_data->>'role'='admin';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Admin count invalid: %',v_count;
  END IF;

  SELECT count(*) INTO v_count FROM auth.users
  WHERE raw_app_meta_data->>'role'='admin'
  AND email='axel.valladares.flores@gmail.com';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected administrator mismatch';
  END IF;

  SELECT string_agg(e.table_name||'.'||e.trigger_name,', ')
  INTO v_violations
  FROM (VALUES
     ('profiles','dc_guard_profile_authority'),
     ('proyectos','dc_guard_project_authority'),
     ('proyectos','dc_block_rapid_duplicate_projects'),
     ('compromisos','dc_guard_commitment_update')
  ) e(table_name,trigger_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=e.table_name
    AND t.tgname=e.trigger_name AND t.tgenabled='O'
  );
  IF v_violations IS NOT NULL THEN
    RAISE EXCEPTION 'Missing/disabled guards: %',v_violations;
  END IF;

  -- Static sanity check only: does not prove control-flow correctness.
  SELECT count(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname LIKE 'dc_admin_%'
  AND (
    NOT p.prosecdef
    OR position('raw_app_meta_data' IN pg_get_functiondef(p.oid))=0
    OR position('auth.uid' IN pg_get_functiondef(p.oid))=0
  );
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Admin RPCs missing trusted authentication pattern: %',v_count;
  END IF;

  RAISE NOTICE 'DealCapital v5.4 guard integrity gate PASSED';
END $audit$;
