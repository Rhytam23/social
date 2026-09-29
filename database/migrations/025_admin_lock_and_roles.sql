-- ============================================================
-- 025: platform admins only from Supabase, group admins that can promote, official-looking names reserved.
-- Re-runnable. Requires 001-022.
--
-- Two different roles, kept apart:
--   Platform admin  profiles.is_admin. The people who run the service. Sees the Admin section.
--   Group admin     conversation_members.role / community_members.role = 'admin'. An ordinary user with
--                   tools inside one group or community. Nothing platform-level.
--
-- 1. is_admin can no longer be changed by ANY API role, including the service role. Before, a leaked
--    service-role key (or a bug in a server route) could make anyone a platform admin. Now the only way is
--    the Supabase dashboard (table editor or SQL editor), which connects without switching to an API role.
--    Every such change is written to the admin activity log.
-- 2. Group admins may promote plain members to admin (in groups and in communities). Only owners demote,
--    change owners or transfer ownership. Nobody changes their own role.
-- 3. A community can have at most 10 channels (sub-groups) for now.
-- 4. Names that look official (containing "admin", "staff", "official", a check mark, reserved handles such
--    as "support") can only belong to platform admins, so nobody can pose as one.
-- ============================================================

-- ---- 1. is_admin lock ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_profile_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  api_role TEXT := current_setting('role', true);
BEGIN
  -- Requests that come through the API run as one of these roles. The Supabase dashboard (table editor,
  -- SQL editor), migrations and the auth service do not switch role, so they are not affected.
  IF api_role IN ('authenticated', 'anon', 'service_role') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_admin := false;
    ELSIF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      IF api_role = 'service_role' THEN
        RAISE EXCEPTION 'is_admin can only be changed from the Supabase dashboard or SQL editor' USING ERRCODE = '42501';
      END IF;
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_profile_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
  VALUES (NULL, 'is_admin_changed_in_supabase', 'user', NEW.id::text, CASE WHEN NEW.is_admin THEN 'granted platform admin' ELSE 'revoked platform admin' END);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_profile_admin_change ON public.profiles;
CREATE TRIGGER trigger_audit_profile_admin_change
  AFTER UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
  EXECUTE FUNCTION public.audit_profile_admin_change();

REVOKE ALL ON FUNCTION public.audit_profile_admin_change() FROM PUBLIC, anon, authenticated;

-- ---- 2. group and community roles ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR current_setting('app.bypass_role_guard', true) = 'on' THEN
    RETURN NEW; -- service role, SQL editor, or a community function that already checked permissions
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
    IF NOT (
      public.is_group_owner(NEW.conversation_id)
      OR public.is_admin()
      -- A group admin may make a plain member an admin (never themselves, never an owner, never a demotion).
      OR (OLD.role = 'member' AND NEW.role = 'admin' AND NEW.user_id <> auth.uid() AND public.is_group_admin(NEW.conversation_id))
    ) THEN
      RAISE EXCEPTION 'Only the group owner can change roles; admins can only make members admins';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_community_role(p_community UUID, p_user UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_actor TEXT;
  v_target TEXT;
BEGIN
  IF p_role NOT IN ('owner', 'admin', 'member') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF p_user = v_uid THEN RAISE EXCEPTION 'You cannot change your own role'; END IF;

  SELECT role INTO v_actor FROM public.community_members WHERE community_id = p_community AND user_id = v_uid;
  SELECT role INTO v_target FROM public.community_members WHERE community_id = p_community AND user_id = p_user;
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Only community owners and admins can change roles'; END IF;
  IF v_target IS NULL THEN RAISE EXCEPTION 'That person is not in this community'; END IF;

  IF v_actor = 'admin' THEN
    -- Admins can make plain members admins. Everything else is for the owner.
    IF NOT (v_target = 'member' AND p_role = 'admin') THEN
      RAISE EXCEPTION 'Admins can only make members admins; other role changes are for the community owner';
    END IF;
  ELSIF v_actor <> 'owner' THEN
    RAISE EXCEPTION 'Only community owners and admins can change roles';
  END IF;

  PERFORM set_config('app.bypass_role_guard', 'on', true);
  UPDATE public.community_members SET role = p_role WHERE community_id = p_community AND user_id = p_user;
  UPDATE public.conversation_members SET role = p_role
  WHERE user_id = p_user AND conversation_id IN (SELECT id FROM public.conversations WHERE community_id = p_community);

  IF p_role = 'owner' THEN
    UPDATE public.community_members SET role = 'admin' WHERE community_id = p_community AND user_id = v_uid;
    UPDATE public.communities SET owner_id = p_user WHERE id = p_community;
    UPDATE public.conversation_members SET role = 'admin'
    WHERE user_id = v_uid AND conversation_id IN (SELECT id FROM public.conversations WHERE community_id = p_community);
  END IF;
END;
$$;

-- ---- 3. at most 10 channels per community --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_channel(
  p_community UUID,
  p_name TEXT,
  p_private BOOLEAN DEFAULT FALSE,
  p_member_ids UUID[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_name TEXT;
  v_chan UUID;
BEGIN
  IF NOT public.is_community_admin(p_community) THEN RAISE EXCEPTION 'Only community admins can create channels'; END IF;
  v_name := regexp_replace(lower(trim(COALESCE(p_name, ''))), '[^a-z0-9_-]+', '-', 'g');
  v_name := trim(both '-' from v_name);
  IF char_length(v_name) < 1 OR char_length(v_name) > 40 THEN RAISE EXCEPTION 'Channel names need 1 to 40 letters or numbers'; END IF;
  IF (SELECT COUNT(*) FROM public.conversations WHERE community_id = p_community) >= 10 THEN
    RAISE EXCEPTION 'A community can have at most 10 channels';
  END IF;

  PERFORM set_config('app.bypass_role_guard', 'on', true);
  INSERT INTO public.conversations (type, name, created_by, community_id, is_private)
  VALUES ('channel', v_name, v_uid, p_community, COALESCE(p_private, FALSE))
  RETURNING id INTO v_chan;

  IF COALESCE(p_private, FALSE) THEN
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT v_chan, cm.user_id, cm.role
    FROM public.community_members cm
    WHERE cm.community_id = p_community AND (cm.user_id = v_uid OR cm.user_id = ANY (p_member_ids));
  ELSE
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT v_chan, cm.user_id, cm.role FROM public.community_members cm WHERE cm.community_id = p_community;
  END IF;

  RETURN v_chan;
END;
$$;

-- ---- 4. official-looking names belong to platform admins -------------------------------------------

CREATE OR REPLACE FUNCTION public.looks_official(p_text TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_text, '') ~* '(admin|moderator|staff|official|verified|nook[ _.-]*(team|support|staff|hq))'
      OR COALESCE(p_text, '') ~ '[✓✔✅☑🛡]'
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_names()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reserved_handles TEXT[] := ARRAY['admin', 'administrator', 'root', 'support', 'staff', 'nook', 'moderator', 'official', 'system'];
BEGIN
  IF NEW.is_admin THEN
    RETURN NEW; -- platform admins may use any name
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.display_name IS NOT DISTINCT FROM OLD.display_name AND NEW.username IS NOT DISTINCT FROM OLD.username THEN
    RETURN NEW;
  END IF;

  IF public.looks_official(NEW.display_name) OR public.looks_official(NEW.username) OR lower(COALESCE(NEW.username, '')) = ANY (reserved_handles) THEN
    IF TG_OP = 'INSERT' THEN
      -- Sign-up must not fail (an auth trigger runs this): give a neutral name the person can change.
      IF public.looks_official(NEW.display_name) THEN NEW.display_name := 'User ' || substr(NEW.id::text, 1, 4); END IF;
      IF public.looks_official(NEW.username) OR lower(COALESCE(NEW.username, '')) = ANY (reserved_handles) THEN
        NEW.username := 'user_' || substr(NEW.id::text, 1, 6);
      END IF;
    ELSE
      RAISE EXCEPTION 'That name is reserved. Please choose another.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_profile_names ON public.profiles;
CREATE TRIGGER trigger_guard_profile_names
  BEFORE INSERT OR UPDATE OF display_name, username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_names();
