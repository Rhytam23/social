-- Migration: 006_production_hardening.sql
-- Description: Close the gaps found in the V1 production audit:
--   1. Invite-only registration was UI theater - anyone could call
--      supabase.auth.signUp() directly with the public anon key and get a
--      fully working account. Enforcement now lives in the on_auth_user_created
--      trigger itself, so it holds regardless of what client code does.
--   2. Bootstraps the very first account (no profiles exist yet) as admin,
--      since an invite-only system needs someone able to issue the first
--      invite.
--   3. Caps 'private' conversations at 2 members so a member can't silently
--      drag a third party into a supposed 1:1 DM.
--   4. Adds a public 'avatars' storage bucket (profile pictures are not
--      secret; message attachments remain in the private encrypted_attachments
--      bucket from 004_storage.sql).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1 & 2. INVITE-ENFORCED REGISTRATION WITH FIRST-USER BOOTSTRAP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invite_token TEXT;
  v_token_hash TEXT;
  v_invite RECORD;
  v_is_first_user BOOLEAN;
  v_normalized_email TEXT;
BEGIN
  v_normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  v_is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);

  IF v_is_first_user THEN
    -- Bootstrap: the first account on a fresh install becomes admin and does
    -- not need an invite (nobody exists yet to issue one).
    INSERT INTO public.profiles (id, username, display_name, email, phone_number, is_admin)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'user_' || substr(NEW.id::text, 1, 6)), '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'User ' || substr(NEW.id::text, 1, 4)), '@', 1)),
      NEW.email,
      NEW.phone,
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, updated_at = NOW();
    RETURN NEW;
  END IF;

  -- Every subsequent registration must carry a valid, unused, non-expired
  -- invite token (passed as signUp options.data.invite_token) assigned to
  -- this exact email address. Raising here rolls back the entire auth.users
  -- insert, so an invalid signup never creates an account at all.
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  IF v_invite_token IS NULL OR length(v_invite_token) < 8 THEN
    RAISE EXCEPTION 'Registration requires a valid invitation token';
  END IF;

  v_token_hash := encode(digest(v_invite_token, 'sha256'), 'hex');

  SELECT * INTO v_invite
  FROM public.invites
  WHERE token_hash = v_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF v_invite.status = 'used' THEN
    RAISE EXCEPTION 'This invitation token has already been used';
  END IF;

  IF v_invite.status = 'revoked' THEN
    RAISE EXCEPTION 'This invitation token has been revoked';
  END IF;

  IF v_invite.expires_at <= NOW() OR v_invite.status = 'expired' THEN
    UPDATE public.invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'This invitation token has expired';
  END IF;

  IF LOWER(TRIM(v_invite.assigned_email)) <> v_normalized_email THEN
    RAISE EXCEPTION 'This invitation was issued for a different email address';
  END IF;

  UPDATE public.invites
  SET status = 'used', used_at = NOW(), used_by = NEW.id
  WHERE id = v_invite.id;

  INSERT INTO public.profiles (id, username, display_name, email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'user_' || substr(NEW.id::text, 1, 6)), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'User ' || substr(NEW.id::text, 1, 4)), '@', 1)),
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger already exists from 005_profiles_phone_email.sql and points at this
-- same function name, so no need to re-create it - CREATE OR REPLACE above
-- is sufficient. Re-stated here for clarity/idempotency.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. PRIVATE CONVERSATION MEMBER CAP
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_private_conversation_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT;
  v_active_members INT;
BEGIN
  SELECT type INTO v_type FROM public.conversations WHERE id = NEW.conversation_id;

  IF v_type = 'private' THEN
    SELECT COUNT(*) INTO v_active_members
    FROM public.conversation_members
    WHERE conversation_id = NEW.conversation_id AND left_at IS NULL;

    IF v_active_members > 2 THEN
      RAISE EXCEPTION 'Private conversations may not have more than 2 members';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_private_conversation_cap ON public.conversation_members;
CREATE TRIGGER trigger_enforce_private_conversation_cap
  AFTER INSERT ON public.conversation_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_private_conversation_cap();

-- ============================================================
-- 4. PUBLIC AVATARS BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
