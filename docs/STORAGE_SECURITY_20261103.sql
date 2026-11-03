-- DealCapital Storage hardening — 2026-11-03
-- Preserves all existing objects. Documents and pitch-decks have no objects
-- at the point of migration; abort if that assumption changes.
-- Media buckets remain public intentionally (avatars, logos, project images).
-- New private PDFs are readable only by the uploader or trusted administrator.

DO $$
BEGIN
  IF (SELECT count(*) FROM storage.objects
      WHERE bucket_id IN ('Documentos','pitch-decks')) <> 0 THEN
    RAISE EXCEPTION 'Migration aborted: private-document buckets contain objects; review migration path first';
  END IF;
  IF (SELECT count(*) FROM storage.buckets
      WHERE id IN ('Documentos','pitch-decks','avatars','logos','imagenes-proyectos')) <> 5 THEN
    RAISE EXCEPTION 'Migration aborted: unexpected storage bucket configuration';
  END IF;
END $$;

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf']::text[]
WHERE id IN ('Documentos', 'pitch-decks');

UPDATE storage.buckets
SET public = true, file_size_limit=5242880,
    allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp']::text[]
WHERE id IN ('avatars','logos','imagenes-proyectos');

-- Supersede over-permissive anonymous write policies.
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar reads" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1oj01fe_3" ON storage.objects;

DROP POLICY IF EXISTS "dc_media_upload_owner" ON storage.objects;
CREATE POLICY "dc_media_upload_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars','logos','imagenes-proyectos')
    AND auth.uid() IS NOT NULL
    AND left(name,37) = auth.uid()::text || '-'
    AND name NOT LIKE '%/%'
    AND lower(storage.extension(name)) IN ('jpeg','jpg','png','webp')
    AND char_length(name) < 160
  );

DROP POLICY IF EXISTS "dc_document_upload_owner" ON storage.objects;
CREATE POLICY "dc_document_upload_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('Documentos','pitch-decks')
    AND auth.uid() IS NOT NULL
    AND left(name,37) = auth.uid()::text || '-'
    AND name NOT LIKE '%/%'
    AND lower(storage.extension(name)) = 'pdf'
    AND char_length(name) < 160
  );

DROP POLICY IF EXISTS "dc_document_read_owner_admin" ON storage.objects;
CREATE POLICY "dc_document_read_owner_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('Documentos','pitch-decks')
    AND (
      owner_id = (SELECT auth.uid())::text
      OR ((SELECT auth.jwt())->'app_metadata'->>'role') = 'admin'
    )
  );

-- No additional UPDATE/DELETE policies. No anonymous uploads, overwrites,
-- moves or deletions are permitted by this migration.
