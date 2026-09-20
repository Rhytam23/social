-- ============================================================
-- 027: group invitations. Nobody can be put into a group by someone they do not know: they get an invitation
-- and choose whether to join.
-- Re-runnable. Requires 001-026.
--
-- Until now a group owner or admin could add any account to a group in one step, and that person could then be
-- messaged in it (the 3-message limit for strangers in 026 only covers direct chats). From now on:
--   * A person the adder KNOWS is added straight away. Known means: a direct chat between them where the adder
--     has been answered (or a platform admin started it), or a community they are both in.
--   * Anyone else receives an invitation (kept 14 days) and joins only if they accept.
--   * Platform admins can add anyone directly.
--   * If the person has blocked the adder, nothing happens and the adder is not told (blocks stay private).
-- Members are no longer added by writing to conversation_members from the app: the only ways in are
-- add_group_member() and respond_group_invite(), which check all of the above. Direct chats and the creator
-- becoming owner of a new group still work as before.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_group_invites_invitee ON public.group_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_inviter_created ON public.group_invites(inviter_id, created_at DESC);

-- No client access at all: everything goes through the functions below.
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_invites FROM anon, authenticated;

DROP TRIGGER IF EXISTS trigger_rate_group_invites ON public.group_invites;
CREATE TRIGGER trigger_rate_group_invites
  BEFORE INSERT ON public.group_invites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_rate('inviter_id', '30', '3600');

-- ---- who counts as "known" ----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_known_contact(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.conversation_members ma ON ma.conversation_id = c.id AND ma.user_id = p_a
      JOIN public.conversation_members mb ON mb.conversation_id = c.id AND mb.user_id = p_b
      WHERE c.type = 'private' AND c.replied
    )
    OR EXISTS (
      SELECT 1
      FROM public.community_members a
      JOIN public.community_members b ON a.community_id = b.community_id
      WHERE a.user_id = p_a AND b.user_id = p_b
    );
$$;
REVOKE ALL ON FUNCTION public.is_known_contact(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_known_contact(UUID, UUID) TO service_role;

-- ---- adding a person to a group -----------------------------------------------------------------------------

-- Returns 'added', 'invited' or 'already'. Only owners and admins of a plain group (not a community channel).
CREATE OR REPLACE FUNCTION public.add_group_member(p_conversation UUID, p_user UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_conv public.conversations%ROWTYPE;
  v_direct BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_user = v_uid THEN RAISE EXCEPTION 'You are already in this group'; END IF;

  SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation AND type = 'group' AND community_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Group not found'; END IF;
  IF NOT public.is_group_admin(p_conversation) THEN RAISE EXCEPTION 'Only group admins can add members'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user) THEN RAISE EXCEPTION 'That person was not found'; END IF;

  IF EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = p_conversation AND user_id = p_user AND left_at IS NULL) THEN
    RETURN 'already';
  END IF;

  -- Someone who blocked you is never added or invited, and you are not told.
  IF EXISTS (SELECT 1 FROM public.blocks WHERE blocker_id = p_user AND blocked_id = v_uid) THEN
    RETURN 'invited';
  END IF;

  v_direct := public.is_admin() OR public.is_known_contact(v_uid, p_user);

  IF v_direct THEN
    IF (SELECT count(*) FROM public.conversation_members WHERE conversation_id = p_conversation AND left_at IS NULL) >= 100 THEN
      RAISE EXCEPTION 'This group is full';
    END IF;
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (p_conversation, p_user)
    ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL, joined_at = NOW(), role = 'member';
    DELETE FROM public.group_invites WHERE conversation_id = p_conversation AND invitee_id = p_user;
    RETURN 'added';
  END IF;

  -- A stranger: an invitation, never more than 30 waiting for one person.
  IF (SELECT count(*) FROM public.group_invites WHERE invitee_id = p_user) >= 30
     AND NOT EXISTS (SELECT 1 FROM public.group_invites WHERE conversation_id = p_conversation AND invitee_id = p_user) THEN
    RETURN 'invited'; -- silently dropped: this person already has plenty waiting
  END IF;

  INSERT INTO public.group_invites (conversation_id, invitee_id, inviter_id)
  VALUES (p_conversation, p_user, v_uid)
  ON CONFLICT (conversation_id, invitee_id) DO UPDATE SET inviter_id = EXCLUDED.inviter_id, created_at = NOW();
  RETURN 'invited';
END;
$$;
REVOKE ALL ON FUNCTION public.add_group_member(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_group_member(UUID, UUID) TO authenticated, service_role;

-- ---- what the invited person sees and does -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.my_group_invites()
RETURNS TABLE (id UUID, conversation_id UUID, group_name TEXT, inviter_id UUID, inviter_name TEXT, inviter_username TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  DELETE FROM public.group_invites gi WHERE gi.invitee_id = auth.uid() AND gi.created_at < NOW() - INTERVAL '14 days';
  RETURN QUERY
    SELECT gi.id, gi.conversation_id, c.name, gi.inviter_id, p.display_name, p.username, gi.created_at
    FROM public.group_invites gi
    JOIN public.conversations c ON c.id = gi.conversation_id
    JOIN public.profiles p ON p.id = gi.inviter_id
    WHERE gi.invitee_id = auth.uid()
    ORDER BY gi.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.my_group_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_group_invites() TO authenticated, service_role;

-- Accept (true) or decline (false). Returns the group id when joined. An invitation only works while the person
-- who sent it is still an owner or admin of the group and it is less than 14 days old.
CREATE OR REPLACE FUNCTION public.respond_group_invite(p_invite UUID, p_accept BOOLEAN)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.group_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO v_inv FROM public.group_invites WHERE id = p_invite AND invitee_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;

  DELETE FROM public.group_invites WHERE id = p_invite;
  IF NOT p_accept THEN RETURN NULL; END IF;

  IF v_inv.created_at < NOW() - INTERVAL '14 days' THEN RAISE EXCEPTION 'This invitation has expired'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = v_inv.conversation_id AND user_id = v_inv.inviter_id AND left_at IS NULL AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'This invitation is no longer valid';
  END IF;
  IF (SELECT count(*) FROM public.conversation_members WHERE conversation_id = v_inv.conversation_id AND left_at IS NULL) >= 100 THEN
    RAISE EXCEPTION 'This group is full';
  END IF;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (v_inv.conversation_id, v_uid)
  ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL, joined_at = NOW(), role = 'member';
  RETURN v_inv.conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_group_invite(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_group_invite(UUID, BOOLEAN) TO authenticated, service_role;

-- ---- close the direct door ----------------------------------------------------------------------------------
-- The creator may still seed a brand-new conversation: both people in a direct chat, or only themselves in a
-- group (the others come in through add_group_member). Group admins can no longer insert members themselves.
DROP POLICY IF EXISTS conversation_members_insert_policy ON public.conversation_members;
CREATE POLICY conversation_members_insert_policy ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
        AND (c.type = 'private' OR user_id = auth.uid())
    )
    AND NOT public.conversation_has_members(conversation_id)
  );
