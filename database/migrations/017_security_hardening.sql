-- 017: security hardening found by an audit of the policies in 001 to 016.
--
--  1. Defence in depth: a person may update their own membership row, and the
--     update policy alone would let them change conversation_id. Postgres also
--     applies the SELECT policy to the new row, which stops it today (tested),
--     but that is an accident of how policies combine, so a trigger now makes
--     the rule explicit: a membership never moves, and a removed member cannot
--     clear left_at themselves.
--  2. The conversation CREATOR could always insert members, forever. After
--     leaving (or after ownership moved on) they could add themselves back
--     as owner, or add anyone. Now only while the conversation has no members
--     yet (the moment it is created), or as a group admin.
--  3. Any member could insert group key envelopes addressed to other members.
--     Envelopes are anonymous sealed boxes, so a malicious member could hand a
--     victim a key the attacker knows. Only group owners and admins may insert.
--  4. Message and receipt rows could be rewritten beyond what an edit needs
--     (moved to another conversation, back-dated, re-parented).
--  5. Storage buckets had no size or type limit of their own, so the API's
--     25 MB check could be skipped by uploading straight to Storage.
--  6. Invite lifetime and use count were unbounded; profile fields users can
--     write were unbounded or could point anywhere (tracking image URLs).
--  7. BLOCKING DID NOT WORK. 015 enforces a block inside the messages insert
--     policy by reading the blocks table, but blocks can only be read by the
--     person who made them, so for the blocked sender that lookup always
--     found nothing and the message went through. Now checked by a
--     SECURITY DEFINER function that can see the block.
--  8. Realtime Broadcast channels (typing, call signalling) were open to any
--     signed-in user who knew a channel name. Policies added below take effect
--     once the app subscribes with private channels (it now does).
--
-- Safe to re-run.

-- ---- 1 and 2: membership ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.conversation_has_members(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = p_conversation_id);
$$;
REVOKE ALL ON FUNCTION public.conversation_has_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.conversation_has_members(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS conversation_members_insert_policy ON public.conversation_members;
CREATE POLICY conversation_members_insert_policy ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      -- The creator seeds a brand-new conversation (all rows in one statement).
      EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
      AND NOT public.conversation_has_members(conversation_id)
    )
    OR public.is_group_admin(conversation_id)
  );

CREATE OR REPLACE FUNCTION public.guard_membership_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / SQL editor
  END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'A membership cannot be moved to another conversation or person';
  END IF;
  -- Someone removed by an admin (left_at set) cannot clear it themselves.
  IF OLD.left_at IS NOT NULL AND NEW.left_at IS NULL
     AND NOT (public.is_group_admin(NEW.conversation_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'You cannot rejoin a conversation you were removed from';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_guard_membership_identity ON public.conversation_members;
CREATE TRIGGER trigger_guard_membership_identity
  BEFORE UPDATE ON public.conversation_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_membership_identity();

-- ---- 3: group key envelopes ------------------------------------------------

DROP POLICY IF EXISTS group_key_envelopes_insert_policy ON public.group_key_envelopes;
CREATE POLICY group_key_envelopes_insert_policy ON public.group_key_envelopes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_group_admin(conversation_id)
    AND public.is_valid_group_key_recipient(conversation_id, user_id, device_id)
  );

-- ---- 4a: blocking that actually blocks -------------------------------------

CREATE OR REPLACE FUNCTION public.is_blocked_in_conversation(p_conversation UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.conversation_members other
      ON other.conversation_id = c.id AND other.user_id <> auth.uid() AND other.left_at IS NULL
    JOIN public.blocks b
      ON b.blocker_id = other.user_id AND b.blocked_id = auth.uid()
    WHERE c.id = p_conversation AND c.type = 'private'
  );
$$;
REVOKE ALL ON FUNCTION public.is_blocked_in_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked_in_conversation(UUID) TO authenticated, service_role;

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
    AND NOT public.is_blocked_in_conversation(conversation_id)
  );

-- ---- 4b: messages and receipts ----------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_message_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- An edit or delete may change only these columns. Everything else is fixed at send time.
  IF (to_jsonb(NEW) - ARRAY['ciphertext', 'nonce', 'encryption_version', 'edited_at', 'deleted_at'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['ciphertext', 'nonce', 'encryption_version', 'edited_at', 'deleted_at']) THEN
    RAISE EXCEPTION 'Only the content of a message can be edited';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_guard_message_columns ON public.messages;
CREATE TRIGGER trigger_guard_message_columns
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_columns();

CREATE OR REPLACE FUNCTION public.guard_receipt_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.message_id IS DISTINCT FROM OLD.message_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'A receipt cannot be moved to another message or person';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_guard_receipt_identity ON public.message_receipts;
CREATE TRIGGER trigger_guard_receipt_identity
  BEFORE UPDATE ON public.message_receipts
  FOR EACH ROW EXECUTE FUNCTION public.guard_receipt_identity();

-- ---- 5: storage ------------------------------------------------------------

UPDATE storage.buckets
SET file_size_limit = 26214400,                       -- 25 MB
    allowed_mime_types = ARRAY['application/octet-stream']  -- attachments are always opaque ciphertext
WHERE id IN ('encrypted_attachments', 'attachments');

-- ---- 6 and 7: bounded and validated user-written fields --------------------------

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
  -- 20 hex characters (80 bits): long enough that guessing an invite is not practical.
  v_code := upper(substr(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 1, 20));
  INSERT INTO public.community_invites (community_id, code_hash, created_by, expires_at, max_uses)
  VALUES (
    p_community,
    encode(sha256(convert_to(v_code, 'utf8')), 'hex'),
    auth.uid(),
    NOW() + make_interval(hours => LEAST(GREATEST(COALESCE(p_hours, 168), 1), 720)),  -- at most 30 days
    LEAST(GREATEST(COALESCE(p_max_uses, 50), 1), 250)
  );
  RETURN v_code; -- shown once; only its hash is stored
END;
$$;

DO $$
BEGIN
  -- Profile photos: this project's public avatar bucket, or a Google sign-in photo. Nothing else,
  -- so a profile cannot make every viewer's browser fetch an arbitrary (tracking) URL.
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_url_allowed;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_url_allowed CHECK (
    avatar_url IS NULL
    OR avatar_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/[^?#]+(\?t=[0-9]+)?$'
    OR avatar_url ~ '^https://[a-z0-9-]+\.googleusercontent\.com/[^\s]+$'
  ) NOT VALID;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferences') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_preferences_size;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_preferences_size CHECK (pg_column_size(preferences) <= 32768) NOT VALID;
  END IF;
END $$;

-- ---- 8: realtime broadcast authorization -----------------------------------
-- Topics: pc-typing:<conversation id>   members of that conversation only
--         pc-call:<user id>             receive: that user; send: someone who shares a conversation with them
-- Effective for channels the app opens with { config: { private: true } }.

DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NULL THEN
    RAISE NOTICE 'realtime.messages not found: skipping realtime policies';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS pc_typing_receive ON realtime.messages;
  CREATE POLICY pc_typing_receive ON realtime.messages FOR SELECT TO authenticated
    USING (
      extension = 'broadcast'
      AND realtime.topic() ~ '^pc-typing:[0-9a-f-]{36}$'
      AND public.is_conversation_member(CASE WHEN realtime.topic() ~ '^pc-typing:[0-9a-f-]{36}$' THEN substr(realtime.topic(), 11)::uuid END)
    );
  DROP POLICY IF EXISTS pc_typing_send ON realtime.messages;
  CREATE POLICY pc_typing_send ON realtime.messages FOR INSERT TO authenticated
    WITH CHECK (
      extension = 'broadcast'
      AND realtime.topic() ~ '^pc-typing:[0-9a-f-]{36}$'
      AND public.is_conversation_member(CASE WHEN realtime.topic() ~ '^pc-typing:[0-9a-f-]{36}$' THEN substr(realtime.topic(), 11)::uuid END)
    );

  DROP POLICY IF EXISTS pc_call_receive ON realtime.messages;
  CREATE POLICY pc_call_receive ON realtime.messages FOR SELECT TO authenticated
    USING (extension = 'broadcast' AND realtime.topic() = 'pc-call:' || auth.uid()::text);
  DROP POLICY IF EXISTS pc_call_send ON realtime.messages;
  CREATE POLICY pc_call_send ON realtime.messages FOR INSERT TO authenticated
    WITH CHECK (
      extension = 'broadcast'
      AND realtime.topic() ~ '^pc-call:[0-9a-f-]{36}$'
      AND public.shares_conversation_with(CASE WHEN realtime.topic() ~ '^pc-call:[0-9a-f-]{36}$' THEN substr(realtime.topic(), 9)::uuid END)
    );
END $$;
