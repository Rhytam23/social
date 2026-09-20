-- ============================================================
-- 028: profiles are visible only to people who have a reason to see them.
-- Re-runnable. Requires 001-027.
--
-- Until now any signed-in person could read every ordinary profile (username, display name, photo, bio, pronouns,
-- time zone) straight through the Supabase API, so the search limits in the app could be skipped by calling the
-- API directly and the whole directory listed. From now on a profile row is visible to:
--   * its owner, and platform admins;
--   * people in a conversation with that person, including people who have since left it (so old messages still
--     show who wrote them);
--   * people in the same community;
--   * people you have blocked (so your block list still shows names).
-- Everyone else sees no row at all, whatever they ask for. Finding a new person is done ONLY by
-- search_profiles_by_prefix(), which can be called only by the server (service role) and is what /api/users uses,
-- so its rate limits cannot be skipped. It never returns platform admins or suspended accounts.
--
-- Email and phone number were already hidden from everyone (011).
-- ============================================================

-- Someone I am in a conversation with now, or who was in one with me: the people whose names appear in my chats.
CREATE OR REPLACE FUNCTION public.shares_conversation_history_with(p_other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members a
    JOIN public.conversation_members b ON a.conversation_id = b.conversation_id
    WHERE a.user_id = auth.uid()
      AND a.left_at IS NULL
      AND b.user_id = p_other_user_id
  );
$$;
REVOKE ALL ON FUNCTION public.shares_conversation_history_with(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_conversation_history_with(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.i_blocked(p_other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.blocks WHERE blocker_id = auth.uid() AND blocked_id = p_other_user_id);
$$;
REVOKE ALL ON FUNCTION public.i_blocked(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.i_blocked(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.shares_conversation_history_with(id)
    OR public.shares_community_with(id)
    OR public.i_blocked(id)
  );

-- ---- finding someone new: server only -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_profiles_by_prefix(p_caller UUID, p_prefix TEXT, p_limit INT DEFAULT 8)
RETURNS TABLE (id UUID, username TEXT, display_name TEXT, avatar_url TEXT, created_at TIMESTAMPTZ, bio TEXT, pronouns TEXT, timezone TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT := lower(coalesce(p_prefix, ''));
BEGIN
  -- Same rule as the app: 3 to 30 letters, numbers, dots or underscores. Nothing else reaches the pattern.
  IF v_prefix !~ '^[a-z0-9_.]{3,30}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT p.id, p.username, p.display_name, p.avatar_url, p.created_at, p.bio, p.pronouns, p.timezone
    FROM public.profiles p
    WHERE p.id <> p_caller
      AND p.username IS NOT NULL
      AND lower(p.username) LIKE replace(v_prefix, '_', '\_') || '%'
      AND NOT COALESCE(p.is_admin, FALSE)
      AND NOT EXISTS (SELECT 1 FROM public.user_moderation m WHERE m.user_id = p.id AND m.banned_until > NOW())
    ORDER BY (lower(p.username) = v_prefix) DESC, p.username ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 8);
END;
$$;
REVOKE ALL ON FUNCTION public.search_profiles_by_prefix(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_by_prefix(UUID, TEXT, INT) TO service_role;
