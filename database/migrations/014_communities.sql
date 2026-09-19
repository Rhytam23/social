-- 014: communities (servers) and channels.
--
-- A community groups people and rooms. Each channel is a `conversations` row
-- of type 'channel', so it reuses everything groups already have: per-channel
-- end-to-end group keys, membership-based access, roles, threads, receipts.
--
--   * Public channel  : every community member is a member of it.
--   * Private channel : only the members chosen when it was created.
--   * Community roles : owner > admin > member. Channel roles mirror them.
--
-- All writes go through SECURITY DEFINER functions (create_community,
-- create_channel, join_community, ...), which check permissions themselves.
-- That also avoids the INSERT ... RETURNING row-level-security trap that
-- breaks direct inserts into `conversations`.
--
-- Encryption note: new members can only read a channel after an existing
-- member's device shares the channel key with them (the community owner's
-- client does this automatically when it is open). Admins and the server
-- can never read messages. Communities are capped at 250 members.
--
-- Safe to re-run.

-- ---- conversations may now be channels ----
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_type_check CHECK (type IN ('private', 'group', 'channel'));
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS group_name_required;
ALTER TABLE public.conversations ADD CONSTRAINT group_name_required CHECK (type = 'private' OR name IS NOT NULL);

-- ---- tables ----
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 300),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  max_uses INT,
  uses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_topic_length;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_topic_length CHECK (topic IS NULL OR char_length(topic) <= 200);

CREATE INDEX IF NOT EXISTS idx_conversations_community ON public.conversations(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);

-- ---- helpers ----
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE community_id = p_community_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_community_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_community_member(UUID) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_community_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_community_admin(UUID) TO authenticated, service_role;

-- The role guard from 013 must let these functions assign roles on behalf of the caller.
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
    IF NOT (public.is_group_owner(NEW.conversation_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'Only the group owner can change roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ---- row level security (reads only; writes go through the functions below) ----
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communities_select_policy ON public.communities;
CREATE POLICY communities_select_policy ON public.communities
  FOR SELECT TO authenticated USING (public.is_community_member(id));

DROP POLICY IF EXISTS communities_update_policy ON public.communities;
CREATE POLICY communities_update_policy ON public.communities
  FOR UPDATE TO authenticated USING (public.is_community_admin(id));

DROP POLICY IF EXISTS community_members_select_policy ON public.community_members;
CREATE POLICY community_members_select_policy ON public.community_members
  FOR SELECT TO authenticated USING (public.is_community_member(community_id));

-- community_invites has no client policies at all: only the functions touch it.

-- ---- functions ----
CREATE OR REPLACE FUNCTION public.create_community(p_name TEXT, p_description TEXT DEFAULT NULL)
RETURNS TABLE (out_community_id UUID, out_channel_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_comm UUID;
  v_chan UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF char_length(trim(COALESCE(p_name, ''))) < 2 THEN RAISE EXCEPTION 'Community names need at least 2 characters'; END IF;
  IF (SELECT COUNT(*) FROM public.communities WHERE owner_id = v_uid) >= 10 THEN
    RAISE EXCEPTION 'You can own at most 10 communities';
  END IF;

  INSERT INTO public.communities (name, description, owner_id)
  VALUES (trim(p_name), NULLIF(trim(COALESCE(p_description, '')), ''), v_uid)
  RETURNING id INTO v_comm;

  INSERT INTO public.community_members (community_id, user_id, role) VALUES (v_comm, v_uid, 'owner');

  PERFORM set_config('app.bypass_role_guard', 'on', true);
  INSERT INTO public.conversations (type, name, created_by, community_id, is_private, topic)
  VALUES ('channel', 'general', v_uid, v_comm, FALSE, 'Welcome to the community')
  RETURNING id INTO v_chan;
  INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES (v_chan, v_uid, 'owner');

  RETURN QUERY SELECT v_comm, v_chan;
END;
$$;

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
  IF (SELECT COUNT(*) FROM public.conversations WHERE community_id = p_community) >= 50 THEN
    RAISE EXCEPTION 'A community can have at most 50 channels';
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

CREATE OR REPLACE FUNCTION public.create_community_invite(p_community UUID, p_hours INT DEFAULT 168, p_max_uses INT DEFAULT 50)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  IF NOT public.is_community_admin(p_community) THEN RAISE EXCEPTION 'Only community admins can create invites'; END IF;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  INSERT INTO public.community_invites (community_id, code_hash, created_by, expires_at, max_uses)
  VALUES (
    p_community,
    encode(sha256(convert_to(v_code, 'utf8')), 'hex'),
    auth.uid(),
    NOW() + make_interval(hours => GREATEST(COALESCE(p_hours, 168), 1)),
    GREATEST(COALESCE(p_max_uses, 50), 1)
  );
  RETURN v_code; -- shown once; only its hash is stored
END;
$$;

CREATE OR REPLACE FUNCTION public.join_community(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_hash TEXT := encode(sha256(convert_to(upper(trim(COALESCE(p_code, ''))), 'utf8')), 'hex');
  v_invite public.community_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO v_invite FROM public.community_invites
  WHERE code_hash = v_hash
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR uses < max_uses);
  IF NOT FOUND THEN RAISE EXCEPTION 'That invite is invalid or has expired'; END IF;

  IF EXISTS (SELECT 1 FROM public.community_members WHERE community_id = v_invite.community_id AND user_id = v_uid) THEN
    RETURN v_invite.community_id;
  END IF;
  IF (SELECT COUNT(*) FROM public.community_members WHERE community_id = v_invite.community_id) >= 250 THEN
    RAISE EXCEPTION 'This community is full';
  END IF;

  INSERT INTO public.community_members (community_id, user_id, role) VALUES (v_invite.community_id, v_uid, 'member');
  UPDATE public.community_invites SET uses = uses + 1 WHERE id = v_invite.id;

  PERFORM set_config('app.bypass_role_guard', 'on', true);
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  SELECT c.id, v_uid, 'member' FROM public.conversations c
  WHERE c.community_id = v_invite.community_id AND NOT c.is_private
  ON CONFLICT DO NOTHING;

  RETURN v_invite.community_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_community(p_community UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
  v_others INT;
BEGIN
  SELECT role INTO v_role FROM public.community_members WHERE community_id = p_community AND user_id = v_uid;
  IF v_role IS NULL THEN RETURN; END IF;
  SELECT COUNT(*) INTO v_others FROM public.community_members WHERE community_id = p_community AND user_id <> v_uid;
  IF v_role = 'owner' AND v_others > 0 THEN
    RAISE EXCEPTION 'Transfer ownership to someone else before leaving';
  END IF;

  DELETE FROM public.conversation_members
  WHERE user_id = v_uid AND conversation_id IN (SELECT id FROM public.conversations WHERE community_id = p_community);
  DELETE FROM public.community_members WHERE community_id = p_community AND user_id = v_uid;
  IF v_others = 0 THEN DELETE FROM public.communities WHERE id = p_community; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_community_member(p_community UUID, p_user UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT;
  v_target TEXT;
BEGIN
  SELECT role INTO v_actor FROM public.community_members WHERE community_id = p_community AND user_id = auth.uid();
  SELECT role INTO v_target FROM public.community_members WHERE community_id = p_community AND user_id = p_user;
  IF v_actor IS NULL OR v_target IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'Use leave instead'; END IF;
  IF NOT (
    (v_actor = 'owner' AND v_target <> 'owner')
    OR (v_actor = 'admin' AND v_target = 'member')
  ) THEN
    RAISE EXCEPTION 'You cannot remove this member';
  END IF;

  DELETE FROM public.conversation_members
  WHERE user_id = p_user AND conversation_id IN (SELECT id FROM public.conversations WHERE community_id = p_community);
  DELETE FROM public.community_members WHERE community_id = p_community AND user_id = p_user;
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
BEGIN
  IF p_role NOT IN ('owner', 'admin', 'member') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_members WHERE community_id = p_community AND user_id = v_uid AND role = 'owner') THEN
    RAISE EXCEPTION 'Only the community owner can change roles';
  END IF;
  IF p_user = v_uid THEN RAISE EXCEPTION 'You cannot change your own role'; END IF;

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

DO $$
DECLARE
  fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'create_community(text,text)',
    'create_channel(uuid,text,boolean,uuid[])',
    'create_community_invite(uuid,int,int)',
    'join_community(text)',
    'leave_community(uuid)',
    'remove_community_member(uuid,uuid)',
    'set_community_role(uuid,uuid,text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END $$;

-- ---- live updates ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'community_members') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'communities') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
    END IF;
  END IF;
END $$;
