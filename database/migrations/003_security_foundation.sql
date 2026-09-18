-- Migration: 003_security_foundation.sql
-- Description: Remove group roles, harden admin authorization, tighten RLS
--              policies, add missing indexes, and add updated_at triggers.
--
-- This migration is intentionally additive and idempotent where possible
-- (DROP ... IF EXISTS, CREATE ... IF NOT EXISTS, CREATE OR REPLACE).

-- ============================================================
-- 1. REMOVE GROUP ROLES
--    Product rule: groups have NO roles. Every member is equal.
-- ============================================================

-- Drop group-admin policies first (they depend on is_group_admin()).
DROP POLICY IF EXISTS conversations_update_policy ON public.conversations;
DROP POLICY IF EXISTS conversation_members_insert_policy ON public.conversation_members;
DROP POLICY IF EXISTS conversation_members_update_policy ON public.conversation_members;
DROP POLICY IF EXISTS conversation_members_delete_policy ON public.conversation_members;

-- Remove the forbidden group-admin helper function.
DROP FUNCTION IF EXISTS public.is_group_admin(UUID);

-- Remove the role column from conversation_members.
ALTER TABLE public.conversation_members DROP COLUMN IF EXISTS role;

-- ============================================================
-- 2. APPLICATION ADMIN AUTHORIZATION
--    Administrative access is a server-controlled property stored in
--    profiles.is_admin. It is NOT derived from client-controllable
--    JWT/app_metadata.
-- ============================================================

-- is_admin() reads ONLY the server-controlled profiles.is_admin column.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Prevent authenticated users from escalating their own is_admin status.
-- Only the service role (or direct database access with no authenticated
-- user context) may set is_admin.
CREATE OR REPLACE FUNCTION public.prevent_profile_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No authenticated user context (service role / direct DB access):
  -- allow the change (bootstrap + admin management).
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Authenticated users can never change is_admin.
  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_profile_admin_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_admin_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_admin_escalation();

-- ============================================================
-- 3. RELATIONSHIP HELPER
--    Used to scope device and presence visibility to users who
--    actually share a conversation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.shares_conversation_with(p_other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members a
    JOIN public.conversation_members b
      ON a.conversation_id = b.conversation_id
    WHERE a.user_id = auth.uid()
      AND a.left_at IS NULL
      AND b.user_id = p_other_user_id
      AND b.left_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.shares_conversation_with(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shares_conversation_with(UUID) TO authenticated, service_role;

-- Helper: validate that a group key envelope recipient is a current member
-- of the SAME group conversation and that the addressed device belongs to
-- that recipient. Prevents cross-user and cross-conversation key confusion.
CREATE OR REPLACE FUNCTION public.is_valid_group_key_recipient(
  p_conversation_id UUID,
  p_user_id UUID,
  p_device_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = p_conversation_id AND c.type = 'group'
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = p_conversation_id
        AND cm.user_id = p_user_id
        AND cm.left_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.user_devices ud
      WHERE ud.user_id = p_user_id
        AND ud.device_id = p_device_id
    );
$$;

REVOKE ALL ON FUNCTION public.is_valid_group_key_recipient(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_valid_group_key_recipient(UUID, UUID, TEXT) TO authenticated, service_role;

-- ============================================================
-- 4. MEMBERSHIP-BASED POLICIES (replacing group-admin policies)
--    Authorization is "is this user a member?", never "what role?".
-- ============================================================

-- Any member (or admin) can update a conversation (name/avatar/etc.).
CREATE POLICY conversations_update_policy ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_conversation_member(id) OR public.is_admin());

-- Only admins can delete conversations.
CREATE POLICY conversations_delete_policy ON public.conversations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Conversation creator or an existing member can add members.
-- This prevents arbitrary self-join by non-members.
CREATE POLICY conversation_members_insert_policy ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
    OR public.is_conversation_member(conversation_id)
  );

-- A user can update only their own membership row (e.g. leave via left_at).
CREATE POLICY conversation_members_update_policy ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- A user can remove their own membership, or an admin can remove members.
CREATE POLICY conversation_members_delete_policy ON public.conversation_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 5. GROUP KEY ENVELOPE INSERT HARDENING
--    A member may only distribute a group key envelope to a recipient who
--    is a current member of the SAME group conversation, addressed to a
--    device that actually belongs to that recipient. This prevents:
--      * inserting envelopes for unrelated users
--      * impersonating another device
--      * cross-conversation key confusion
-- ============================================================

DROP POLICY IF EXISTS group_key_envelopes_insert_policy ON public.group_key_envelopes;

CREATE POLICY group_key_envelopes_insert_policy ON public.group_key_envelopes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_conversation_member(conversation_id)
    AND public.is_valid_group_key_recipient(conversation_id, user_id, device_id)
  );

-- ============================================================
-- 6. USER DEVICE VISIBILITY
--    Public cryptographic identity material is visible only to the device
--    owner and to users who share a conversation with the owner. A dedicated
--    prekey-bundle function (E2EE phase) will expose public keys for session
--    establishment without broadening this table's SELECT policy.
-- ============================================================

DROP POLICY IF EXISTS user_devices_select_policy ON public.user_devices;

CREATE POLICY user_devices_select_policy ON public.user_devices
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.shares_conversation_with(user_id)
  );

-- ============================================================
-- 7. PRESENCE VISIBILITY
--    Presence is visible only to the user themselves and to users who
--    share a conversation with them.
-- ============================================================

DROP POLICY IF EXISTS presence_select_policy ON public.presence;

CREATE POLICY presence_select_policy ON public.presence
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.shares_conversation_with(user_id)
  );

-- ============================================================
-- 8. MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_user ON public.message_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_key_envelopes_user_id ON public.group_key_envelopes(user_id);

-- ============================================================
-- 9. updated_at TRIGGERS
--    Automatically maintain updated_at on UPDATE, independent of client.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_conversations_updated_at ON public.conversations;
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_devices_updated_at ON public.user_devices;
CREATE TRIGGER set_user_devices_updated_at
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_presence_updated_at ON public.presence;
CREATE TRIGGER set_presence_updated_at
  BEFORE UPDATE ON public.presence
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
