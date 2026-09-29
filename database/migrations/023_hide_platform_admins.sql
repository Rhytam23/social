-- ============================================================
-- 023: platform admins cannot be found by people they have not talked to.
-- Re-runnable. Requires 001-022.
--
-- Until now every signed-in person could read every profile's public columns (name, username, photo, bio)
-- straight through the Supabase API, so anyone who knew an admin's username, or simply listed the table,
-- could find them. From now on a platform admin's profile is visible only to:
--   * themselves,
--   * other platform admins,
--   * people who share a conversation with them (for example after the admin starts a chat), and
--   * people who are in the same community.
-- Everyone else sees no row at all, whatever they ask for (username search, listing, embedded joins).
--
-- Other people's profiles are unchanged: public columns stay readable as before (email and phone remain
-- private, see 011). "Not findable" means not discoverable: anyone the admin talks to knows who they are,
-- and the admin's user id can still appear in the live presence list (the admin can appear offline).
-- ============================================================

CREATE OR REPLACE FUNCTION public.shares_community_with(p_other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members a
    JOIN public.community_members b ON a.community_id = b.community_id
    WHERE a.user_id = auth.uid()
      AND b.user_id = p_other_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.shares_community_with(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_community_with(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR NOT is_admin
    OR public.is_admin()
    OR public.shares_conversation_with(id)
    OR public.shares_community_with(id)
  );
