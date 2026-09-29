-- ============================================================
-- 029: group invite links. An owner or admin of a group creates a link; anyone signed in who opens it joins the
-- group straight away.
-- Re-runnable, additive only (no existing data or function is dropped). Requires 001-028.
--
-- Why a function and not a plain insert: since 027 nobody writes to conversation_members from the app, so joining by
-- link has to be a SECURITY DEFINER function that checks the link itself. The link code is 80 random bits and only
-- its SHA-256 hash is stored, exactly like community invites (014), so a database leak does not leak working links.
--
-- Rules:
--   * Only owners and admins of a plain group (not a community channel) can create or revoke links.
--   * A link expires (default 30 days), can be limited in uses (default 100), and can be revoked at any time.
--   * Joining twice is harmless (returns the group). Someone who left or was removed cannot use a link to get back in
--     (a group admin adds them again), so removing a person really removes them.
--   * A person whom an owner or admin of the group has blocked is refused.
--   * The group holds at most 100 members (same cap as 027).
--   * Every failure gives the same message so a bad code reveals nothing about the group.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.group_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL CHECK (max_uses > 0),
  uses INT NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_group_invite_links_conversation ON public.group_invite_links(conversation_id);

-- No client access at all: everything goes through the functions below.
ALTER TABLE public.group_invite_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_invite_links FROM anon, authenticated;

-- At most 20 links per person per hour.
DROP TRIGGER IF EXISTS trigger_rate_group_invite_links ON public.group_invite_links;
CREATE TRIGGER trigger_rate_group_invite_links
  BEFORE INSERT ON public.group_invite_links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_rate('created_by', '20', '3600');

-- ---- create ---------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_group_invite_link(p_conversation UUID, p_hours INT DEFAULT 720, p_max_uses INT DEFAULT 100)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE id = p_conversation AND type = 'group' AND community_id IS NULL) THEN
    RAISE EXCEPTION 'Group not found';
  END IF;
  IF NOT public.is_group_admin(p_conversation) THEN RAISE EXCEPTION 'Only group admins can create invite links'; END IF;

  -- 20 hex characters (80 bits): long enough that guessing a link is not practical.
  v_code := upper(substr(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 1, 20));
  INSERT INTO public.group_invite_links (conversation_id, code_hash, created_by, expires_at, max_uses)
  VALUES (
    p_conversation,
    encode(sha256(convert_to(v_code, 'utf8')), 'hex'),
    v_uid,
    NOW() + make_interval(hours => LEAST(GREATEST(COALESCE(p_hours, 720), 1), 8760)),
    LEAST(GREATEST(COALESCE(p_max_uses, 100), 1), 1000)
  );
  RETURN v_code; -- shown once; only its hash is stored
END;
$$;
REVOKE ALL ON FUNCTION public.create_group_invite_link(UUID, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group_invite_link(UUID, INT, INT) TO authenticated, service_role;

-- ---- revoke ---------------------------------------------------------------------------------------------------

-- Stops every working link of the group. Returns how many were stopped.
CREATE OR REPLACE FUNCTION public.revoke_group_invite_links(p_conversation UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT public.is_group_admin(p_conversation) THEN RAISE EXCEPTION 'Only group admins can revoke invite links'; END IF;
  UPDATE public.group_invite_links SET revoked_at = NOW()
  WHERE conversation_id = p_conversation AND revoked_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_group_invite_links(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_group_invite_links(UUID) TO authenticated, service_role;

-- ---- join -----------------------------------------------------------------------------------------------------

-- Returns the group id. The message is the same for a wrong, expired, revoked, used-up or refused link.
CREATE OR REPLACE FUNCTION public.join_group_by_link(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_hash TEXT := encode(sha256(convert_to(upper(trim(COALESCE(p_code, ''))), 'utf8')), 'hex');
  v_link public.group_invite_links%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT l.* INTO v_link
  FROM public.group_invite_links l
  JOIN public.conversations c ON c.id = l.conversation_id AND c.type = 'group' AND c.community_id IS NULL
  WHERE l.code_hash = v_hash
    AND l.revoked_at IS NULL
    AND l.expires_at > NOW()
    AND l.uses < l.max_uses
  FOR UPDATE OF l;
  IF NOT FOUND THEN RAISE EXCEPTION 'That link is invalid or has expired'; END IF;

  -- Already inside: nothing to do (and the link is not used up).
  IF EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = v_link.conversation_id AND user_id = v_uid AND left_at IS NULL
  ) THEN
    RETURN v_link.conversation_id;
  END IF;

  -- Someone who left or was removed does not get back in on their own (the same rule as invitations, migration 017):
  -- a group admin has to add them again.
  IF EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = v_link.conversation_id AND user_id = v_uid AND left_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'You left this group. Ask a group admin to add you again.';
  END IF;

  -- Someone an owner or admin of this group has blocked does not get in this way (and is not told why).
  IF EXISTS (
    SELECT 1
    FROM public.blocks b
    JOIN public.conversation_members m
      ON m.user_id = b.blocker_id AND m.conversation_id = v_link.conversation_id AND m.left_at IS NULL AND m.role IN ('owner', 'admin')
    WHERE b.blocked_id = v_uid
  ) THEN
    RAISE EXCEPTION 'That link is invalid or has expired';
  END IF;

  IF (SELECT count(*) FROM public.conversation_members WHERE conversation_id = v_link.conversation_id AND left_at IS NULL) >= 100 THEN
    RAISE EXCEPTION 'This group is full';
  END IF;

  PERFORM set_config('app.bypass_role_guard', 'on', true);
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (v_link.conversation_id, v_uid)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  DELETE FROM public.group_invites WHERE conversation_id = v_link.conversation_id AND invitee_id = v_uid;
  UPDATE public.group_invite_links SET uses = uses + 1 WHERE id = v_link.id;

  RETURN v_link.conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.join_group_by_link(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_group_by_link(TEXT) TO authenticated, service_role;
