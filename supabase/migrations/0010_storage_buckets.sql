-- ============================================================================
-- 0010_storage_buckets.sql
-- Ensures required storage buckets exist. Idempotent. Storage policies in
-- 0005_storage_policies.sql govern the objects in them.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resources', 'resources', true),
  ('avatars',   'avatars',   true)
ON CONFLICT (id) DO NOTHING;
