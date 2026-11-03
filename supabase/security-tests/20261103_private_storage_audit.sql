-- DealCapital v5.6 / Storage and public-schema audit gate
-- Read-only. Intended for privileged Supabase SQL editor.
-- Detects accidental public visibility of confidential document buckets.
DO $gate$
DECLARE v_bad text; v_missing int;
BEGIN
  SELECT string_agg(id,', ') INTO v_bad
  FROM storage.buckets
  WHERE id IN ('Documentos','pitch-decks','dealcapital-qa') AND public IS DISTINCT FROM false;
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Confidential bucket(s) public: %',v_bad;
  END IF;

  SELECT count(*) INTO v_missing FROM (
    VALUES ('Documentos'),('pitch-decks'),('dealcapital-qa')
  ) expected(id)
  WHERE NOT EXISTS(SELECT 1 FROM storage.buckets b WHERE b.id=expected.id AND b.public=false);
  IF v_missing>0 THEN RAISE EXCEPTION 'Missing private storage buckets: %',v_missing; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity
  ) THEN RAISE EXCEPTION 'A public application table has RLS disabled'; END IF;

  IF NOT EXISTS(
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='storage' AND c.relname='objects' AND c.relrowsecurity
  ) THEN RAISE EXCEPTION 'storage.objects RLS is disabled or missing'; END IF;

  RAISE NOTICE 'DealCapital private document bucket + RLS configuration passed';
END $gate$;

-- Manual review (not automated pass/fail):
-- SELECT policyname,roles,cmd,qual,with_check FROM pg_policies
-- WHERE schemaname='storage' AND tablename='objects';
--
-- IMPORTANT:
-- No storage.objects policies were returned by a production catalog read
-- on 2026-11-03. This is default-deny for browser roles, not proof of
-- an end-to-end working user upload/download flow.
-- Public buckets can serve publicly readable objects, but do not imply
-- anonymous write permissions. Direct client uploads may be blocked.
-- Validate legitimate user upload, download, replacement and removal
-- in isolated staging with signed sessions before changing any policies.
-- Never make 'Documentos' or 'pitch-decks' public to fix access problems.
