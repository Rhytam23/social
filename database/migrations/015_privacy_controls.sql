-- 015: privacy controls.
--
-- 1. Disappearing messages. conversations.disappear_after (seconds) is the
--    timer; a trigger stamps messages.expires_at on insert, so the timer is
--    enforced by the database and cannot be skipped by a modified client.
--    purge_expired_messages() deletes expired rows (scheduled with pg_cron
--    when that extension is enabled; the app also calls it while open).
--    Limitation: encrypted attachment files in Storage are not removed,
--    because the server cannot see which file a message referred to.
-- 2. Blocking. A blocked person can no longer send direct messages to the
--    person who blocked them (enforced by the messages insert policy).
-- 3. Reports. A reporter may choose to attach the text of a message they can
--    read; only platform admins can read reports.
--
-- Safe to re-run.

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS disappear_after INT;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_disappear_after_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_disappear_after_check CHECK (disappear_after IS NULL OR disappear_after >= 3600);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_messages_expires ON public.messages(expires_at) WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.stamp_message_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_after INT;
BEGIN
  SELECT disappear_after INTO v_after FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_after IS NOT NULL THEN
    NEW.expires_at := NOW() + make_interval(secs => v_after);
  ELSE
    NEW.expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_stamp_message_expiry ON public.messages;
CREATE TRIGGER trigger_stamp_message_expiry
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.stamp_message_expiry();

CREATE OR REPLACE FUNCTION public.purge_expired_messages()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_messages() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_messages() TO authenticated, service_role;

-- Members of a direct chat, or managers of a group/channel, may change the timer.
CREATE OR REPLACE FUNCTION public.set_disappearing(p_conversation UUID, p_seconds INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT type INTO v_type FROM public.conversations WHERE id = p_conversation;
  IF v_type IS NULL THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF p_seconds IS NOT NULL AND p_seconds < 3600 THEN RAISE EXCEPTION 'The shortest timer is one hour'; END IF;

  IF v_type = 'private' THEN
    IF NOT public.is_conversation_member(p_conversation) THEN RAISE EXCEPTION 'You are not in this conversation'; END IF;
  ELSE
    IF NOT public.is_group_admin(p_conversation) THEN RAISE EXCEPTION 'Only group admins can change disappearing messages'; END IF;
  END IF;

  UPDATE public.conversations SET disappear_after = p_seconds WHERE id = p_conversation;
END;
$$;

REVOKE ALL ON FUNCTION public.set_disappearing(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_disappearing(UUID, INT) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('purge-expired-messages', '*/5 * * * *', 'SELECT public.purge_expired_messages()');
  END IF;
END $$;

-- ---- blocking ----
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blocks_select_policy ON public.blocks;
CREATE POLICY blocks_select_policy ON public.blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
DROP POLICY IF EXISTS blocks_insert_policy ON public.blocks;
CREATE POLICY blocks_insert_policy ON public.blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
DROP POLICY IF EXISTS blocks_delete_policy ON public.blocks;
CREATE POLICY blocks_delete_policy ON public.blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- Keeps the 013 rules (member, admin-only groups) and adds: you cannot message someone who blocked you.
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
    AND NOT EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.conversation_members other
        ON other.conversation_id = c.id AND other.user_id <> auth.uid() AND other.left_at IS NULL
      JOIN public.blocks b
        ON b.blocker_id = other.user_id AND b.blocked_id = auth.uid()
      WHERE c.id = conversation_id AND c.type = 'private'
    )
  );

-- ---- reports ----
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  excerpt TEXT CHECK (excerpt IS NULL OR char_length(excerpt) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_insert_policy ON public.reports;
CREATE POLICY reports_insert_policy ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS reports_select_policy ON public.reports;
CREATE POLICY reports_select_policy ON public.reports FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS reports_update_policy ON public.reports;
CREATE POLICY reports_update_policy ON public.reports FOR UPDATE TO authenticated USING (public.is_admin());
