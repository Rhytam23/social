-- Migration: 004_storage.sql
-- Description: Establish the secure Supabase Storage foundation for encrypted
--              attachments. The bucket is PRIVATE (not publicly readable).
--
-- Attachment model:
--   * Attachments are encrypted client-side (AES-256-GCM) before upload.
--   * Objects are organized under conversation folders: {conversation_id}/{timestamp}_{filename}
--   * The decryption key travels inside the E2EE message, never in storage.
--   * Storage access is defense-in-depth: ciphertext is useless without the
--     key, but unauthorized users must still not be able to fetch it.

-- Create private encrypted_attachments bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted_attachments', 'encrypted_attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Conversation-scoped & owner-scoped policies for encrypted_attachments
DROP POLICY IF EXISTS "encrypted_attachments_select" ON storage.objects;
CREATE POLICY "encrypted_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('encrypted_attachments', 'attachments')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND public.is_conversation_member(((storage.foldername(name))[1])::uuid)
      )
    )
  );

DROP POLICY IF EXISTS "encrypted_attachments_insert" ON storage.objects;
CREATE POLICY "encrypted_attachments_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('encrypted_attachments', 'attachments')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND public.is_conversation_member(((storage.foldername(name))[1])::uuid)
      )
    )
  );

DROP POLICY IF EXISTS "encrypted_attachments_delete" ON storage.objects;
CREATE POLICY "encrypted_attachments_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('encrypted_attachments', 'attachments')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

