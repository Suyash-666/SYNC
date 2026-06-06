-- ============================================================================
-- 0005_storage_policies.sql
-- Storage policies for resources + avatars buckets
-- Compatible with Supabase managed storage schema
-- ============================================================================

-- ============================================================================
-- resources bucket policies
-- ============================================================================

DROP POLICY IF EXISTS resources_public_select ON storage.objects;
CREATE POLICY resources_public_select
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'resources'
);

DROP POLICY IF EXISTS resources_owner_insert ON storage.objects;
CREATE POLICY resources_owner_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS resources_owner_update ON storage.objects;
CREATE POLICY resources_owner_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resources'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'resources'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS resources_owner_delete ON storage.objects;
CREATE POLICY resources_owner_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- ============================================================================
-- avatars bucket policies
-- ============================================================================

DROP POLICY IF EXISTS avatars_public_select ON storage.objects;
CREATE POLICY avatars_public_select
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);

DROP POLICY IF EXISTS avatars_owner_insert ON storage.objects;
CREATE POLICY avatars_owner_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS avatars_owner_delete ON storage.objects;
CREATE POLICY avatars_owner_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);