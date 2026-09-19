-- 013: group roles, group settings, and message threads.
--
-- Roles: owner > admin > member, per group. Until now every member could add
-- anyone, rename the group, or remove themselves only; nobody could remove
-- others except platform admins.
--   * owner: everything, and the only role that can change other roles.
--   * admin: add and remove members, rename, edit the description, and turn
--     "only admins can post" on or off.
--   * member: read, post (unless the group is admin-only), leave.
--
-- Threads: messages.thread_root_id points a reply at the message it belongs
-- to. The reply text stays end-to-end encrypted; the server can see WHICH
-- message a reply is attached to, and nothing else.
--
-- Safe to re-run.

ALTER TABLE public.conversation_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_role_check;
ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_role_check CHECK (role IN ('owner', 'admin', 'member'));

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS only_admins_post BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_description_length;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_description_length CHECK (description IS NULL OR char_length(description) <= 500);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS thread_root_id UUID REFERENCES public.messages(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_thread_root ON public.messages(thread_root_id) WHERE thread_root_id IS NOT NULL;

-- Existing groups: the creator becomes the owner (only where no owner exists yet).
UPDATE public.conversation_members cm
SET role = 'owner'
FROM public.conversations c
WHERE c.id = cm.conversation_id
  AND c.type = 'group'
  AND c.created_by = cm.user_id
  AND cm.role = 'member'
  AND NOT EXISTS (
    SELECT 1 FROM public.conversation_members o
    WHERE o.conversation_id = cm.conversation_id AND o.role = 'owner'
  );

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
      AND left_at IS NULL
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(p_conversation_id UUID)
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
      AND role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_group_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_owner(UUID) TO authenticated, service_role;

-- Who may add members: the creator while the group is being set up (any
-- conversation), or a group admin afterwards. Plain members can no longer add people.
DROP POLICY IF EXISTS conversation_members_insert_policy ON public.conversation_members;
CREATE POLICY conversation_members_insert_policy ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
    OR public.is_group_admin(conversation_id)
  );

-- Update own row (e.g. last_read_at), or an admin manages members. The trigger
-- below stops anyone except the owner from changing a role.
DROP POLICY IF EXISTS conversation_members_update_policy ON public.conversation_members;
CREATE POLICY conversation_members_update_policy ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_admin(conversation_id) OR public.is_admin());

-- Leave yourself, or admins remove members (never the owner).
DROP POLICY IF EXISTS conversation_members_delete_policy ON public.conversation_members;
CREATE POLICY conversation_members_delete_policy ON public.conversation_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR (public.is_group_admin(conversation_id) AND role <> 'owner')
    OR public.is_admin()
  );

-- Role changes are owner-only; nobody can give themselves a role at insert time
-- except the creator taking ownership of their own new group.
CREATE OR REPLACE FUNCTION public.guard_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / SQL editor
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role <> 'member' THEN
      IF NOT (
        NEW.user_id = auth.uid()
        AND NEW.role = 'owner'
        AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = NEW.conversation_id AND c.created_by = auth.uid())
      ) THEN
        RAISE EXCEPTION 'You cannot assign that role';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (public.is_group_owner(NEW.conversation_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'Only the group owner can change roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_member_role ON public.conversation_members;
CREATE TRIGGER trigger_guard_member_role
  BEFORE INSERT OR UPDATE ON public.conversation_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_member_role();

-- Group settings (name, description, admin-only posting): group admins only.
DROP POLICY IF EXISTS conversations_update_policy ON public.conversations;
CREATE POLICY conversations_update_policy ON public.conversations
  FOR UPDATE TO authenticated
  USING ((type = 'group' AND public.is_group_admin(id)) OR public.is_admin());

-- "Only admins can post" is enforced by the database, not just the UI.
DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
CREATE POLICY messages_insert_policy ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(conversation_id)
    AND (
      NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.only_admins_post)
      OR public.is_group_admin(conversation_id)
    )
  );
