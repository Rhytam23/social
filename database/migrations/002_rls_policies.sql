-- Migration: 002_rls_policies.sql
-- Description: Enable Row Level Security (RLS) across all application tables and define helper functions and security policies.

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_key_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- SECURITY HELPER FUNCTIONS (Derive identity from auth.uid())
-- ----------------------------------------------------

-- Helper: Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean),
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Helper: Check if current authenticated user is a member of a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
$$;

-- Helper: Check if current authenticated user is an admin of a group conversation
CREATE OR REPLACE FUNCTION public.is_group_admin(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND left_at IS NULL
  );
$$;

-- Revoke public execution on helper functions
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_conversation_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_group_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID) TO authenticated, service_role;

-- ----------------------------------------------------
-- PROFILES POLICIES & TRIGGERS
-- ----------------------------------------------------

-- Authenticated users can read profiles
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Prevent users from escalating their own is_admin status on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.prevent_profile_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin = true AND NOT public.is_admin() THEN
      NEW.is_admin := false;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      IF NOT public.is_admin() THEN
        NEW.is_admin := OLD.is_admin;
      END IF;
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

-- ----------------------------------------------------
-- INVITES POLICIES
-- ----------------------------------------------------

-- Only admins can read invites
CREATE POLICY invites_select_policy ON public.invites
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only admins can insert invites
CREATE POLICY invites_insert_policy ON public.invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update invites
CREATE POLICY invites_update_policy ON public.invites
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Only admins can delete invites
CREATE POLICY invites_delete_policy ON public.invites
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------
-- CONVERSATIONS POLICIES
-- ----------------------------------------------------

-- Conversation members or admins can read conversations
CREATE POLICY conversations_select_policy ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(id) OR public.is_admin());

-- Authenticated users can create conversations
CREATE POLICY conversations_insert_policy ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only group admins can update conversations
CREATE POLICY conversations_update_policy ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_group_admin(id) OR public.is_admin());

-- ----------------------------------------------------
-- CONVERSATION MEMBERS POLICIES
-- ----------------------------------------------------

-- Members can view membership of their conversations
CREATE POLICY conversation_members_select_policy ON public.conversation_members
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id) OR public.is_admin());

-- Group admins or conversation creator can add members (prevents arbitrary self-join)
CREATE POLICY conversation_members_insert_policy ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND c.created_by = auth.uid()
      ) AND user_id = auth.uid()
    ) OR
    public.is_group_admin(conversation_id) OR
    public.is_admin()
  );

-- Group admins can update membership roles
CREATE POLICY conversation_members_update_policy ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (public.is_group_admin(conversation_id) OR public.is_admin());

-- Members can leave (delete/update left_at) or group admins can remove members
CREATE POLICY conversation_members_delete_policy ON public.conversation_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_admin(conversation_id) OR public.is_admin());

-- ----------------------------------------------------
-- MESSAGES POLICIES
-- ----------------------------------------------------

-- Members can read messages in their conversations
CREATE POLICY messages_select_policy ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));

-- Members can send messages as themselves
CREATE POLICY messages_insert_policy ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    public.is_conversation_member(conversation_id)
  );

-- Senders can edit/delete their own messages
CREATE POLICY messages_update_policy ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id));

CREATE POLICY messages_delete_policy ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id));

-- ----------------------------------------------------
-- MESSAGE REACTIONS POLICIES
-- ----------------------------------------------------

CREATE POLICY message_reactions_select_policy ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.is_conversation_member(m.conversation_id)
    )
  );

CREATE POLICY message_reactions_insert_policy ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.is_conversation_member(m.conversation_id)
    )
  );

CREATE POLICY message_reactions_delete_policy ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------
-- MESSAGE RECEIPTS POLICIES
-- ----------------------------------------------------

CREATE POLICY message_receipts_select_policy ON public.message_receipts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.is_conversation_member(m.conversation_id)
    )
  );

CREATE POLICY message_receipts_insert_policy ON public.message_receipts
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.is_conversation_member(m.conversation_id)
    )
  );

CREATE POLICY message_receipts_update_policy ON public.message_receipts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------
-- USER DEVICES POLICIES
-- ----------------------------------------------------

-- Authenticated users can view public device keys for key exchange
CREATE POLICY user_devices_select_policy ON public.user_devices
  FOR SELECT TO authenticated
  USING (true);

-- Users can insert/update/delete only their own devices
CREATE POLICY user_devices_insert_policy ON public.user_devices
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_devices_update_policy ON public.user_devices
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_devices_delete_policy ON public.user_devices
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------
-- GROUP KEY ENVELOPES POLICIES
-- ----------------------------------------------------

-- Users can access only their own encrypted key envelopes
CREATE POLICY group_key_envelopes_select_policy ON public.group_key_envelopes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id));

-- Members can insert group key envelopes for other members
CREATE POLICY group_key_envelopes_insert_policy ON public.group_key_envelopes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_conversation_member(conversation_id));

-- ----------------------------------------------------
-- PRESENCE POLICIES
-- ----------------------------------------------------

CREATE POLICY presence_select_policy ON public.presence
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY presence_insert_policy ON public.presence
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY presence_update_policy ON public.presence
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
