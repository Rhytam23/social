-- 021: attachment uploads go through signed addresses issued by the server.
--
-- Until now any member could upload straight to the attachments bucket with their own session, which
-- bypassed every limit the API applies. After this migration the only way to store an attachment is
-- POST /api/uploads/sign (membership, size per kind, rate, daily quota), then upload to the signed
-- address, then POST /api/uploads/complete (real size check). Downloads are unchanged.
--
-- Needs 001 to 020. Safe to run twice. Deploy the matching app version FIRST: the previous version
-- uploaded through /api/uploads with the user's own session, which this migration stops allowing.
-- If your Supabase plan caps files below 100 MB (the free plan caps at 50 MB), the plan limit wins;
-- set NEXT_PUBLIC_STORAGE_MAX_FILE_MB on the host to the same number.

-- 1. The bucket accepts one opaque file up to 100 MB (attachments are always encrypted).
UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['application/octet-stream']
WHERE id = 'encrypted_attachments';

-- 2. Profile photos are small images.
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

-- 3. No direct client uploads to the attachments buckets.
DROP POLICY IF EXISTS "encrypted_attachments_insert" ON storage.objects;

-- 4. Daily quota: bytes this person has uploaded in the last 24 hours. Files are stored as
--    <conversation id>/<uploader id>_<random>, so the uploader is read from the name. Server only.
CREATE OR REPLACE FUNCTION public.uploaded_bytes_last_day(p_user UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT COALESCE(SUM(COALESCE((o.metadata ->> 'size')::BIGINT, 0)), 0)::BIGINT
  FROM storage.objects o
  WHERE o.bucket_id = 'encrypted_attachments'
    AND o.created_at > NOW() - INTERVAL '1 day'
    AND split_part(o.name, '/', 2) LIKE p_user::TEXT || '\_%';
$$;

REVOKE ALL ON FUNCTION public.uploaded_bytes_last_day(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uploaded_bytes_last_day(UUID) TO service_role;
