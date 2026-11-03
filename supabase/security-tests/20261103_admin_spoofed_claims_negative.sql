-- DealCapital v5.5 / Negative authorization tests for admin read-only RPCs.
-- Execute as privileged maintainer in Supabase SQL Editor.
-- Does NOT create accounts, change records, or invoke mutating admin RPCs.
-- Simulates request-scoped claims in SQL; it is NOT a signed-JWT HTTP test.
DO $test$
DECLARE
  v_user uuid;
  v_denied boolean;
  v_rpc text;
BEGIN
  SELECT id INTO v_user FROM auth.users
  WHERE coalesce(raw_app_meta_data->>'role','') <> 'admin'
  ORDER BY created_at LIMIT 1;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No non-admin user available for negative authorization test';
  END IF;

  -- Deliberately provide forged claim metadata for a real non-admin identity.
  -- Trusted RPCs must consult auth.users.raw_app_meta_data, not this payload.
  PERFORM set_config('request.jwt.claim.sub', v_user::text, true);
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object(
      'sub',v_user,'role','authenticated',
      'app_metadata',jsonb_build_object('role','admin')
    )::text,true);

  FOREACH v_rpc IN ARRAY ARRAY[
    'dc_admin_retention_holds',
    'dc_admin_storage_qa_history',
    'dc_admin_rejection_queue',
    'dc_admin_review_history'
  ] LOOP
    v_denied := false;
    BEGIN
      CASE v_rpc
        WHEN 'dc_admin_retention_holds' THEN
          PERFORM * FROM public.dc_admin_retention_holds();
        WHEN 'dc_admin_storage_qa_history' THEN
          PERFORM * FROM public.dc_admin_storage_qa_history(1);
        WHEN 'dc_admin_rejection_queue' THEN
          PERFORM * FROM public.dc_admin_rejection_queue(1);
        WHEN 'dc_admin_review_history' THEN
          PERFORM * FROM public.dc_admin_review_history(1);
      END CASE;
    EXCEPTION WHEN insufficient_privilege THEN
      v_denied := true;
    END;

    IF NOT v_denied THEN
      RAISE EXCEPTION 'SECURITY GATE FAILED: % accepted forged admin claims', v_rpc;
    END IF;
  END LOOP;
  RAISE NOTICE 'DealCapital v5.5: all four admin read-only RPC authorization checks passed';
END $test$;

-- LIMITATIONS:
-- 1. SQL emulates request claims; no real signed JWT / HTTP is involved.
-- 2. This tests denial behavior of four read-only RPCs only.
-- 3. It does not demonstrate owner-based RLS, mutating RPC authorization,
--    Storage object policies, or revocation of an already-issued JWT.
-- 4. Use a separate staging project and authenticated HTTP sessions for E2E.
