-- 012: state that makes chats feel alive and persistent.
--
-- 1. conversation_members.last_read_at: server-backed unread counts that
--    survive a refresh and sync across tabs.
-- 2. get_unread_counts(): one call returns unread messages per conversation.
-- 3. saved_messages: personal bookmarks. The server stores only WHICH message
--    you saved (message_id), never its text, so end-to-end encryption is
--    unchanged. The server does learn that you bookmarked a message.
-- 4. message_receipts / message_reactions are already in the Realtime
--    publication (008); saved_messages is owner-only and not published.
--
-- Safe to re-run.

ALTER TABLE public.conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Members may already update their own membership row (003); last_read_at
-- rides on that policy. Existing members start fully caught up.
UPDATE public.conversation_members SET last_read_at = NOW() WHERE last_read_at IS NULL;

CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS TABLE (conversation_id UUID, unread BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT m.conversation_id, COUNT(*)::BIGINT
  FROM public.messages m
  JOIN public.conversation_members cm
    ON cm.conversation_id = m.conversation_id
   AND cm.user_id = auth.uid()
   AND cm.left_at IS NULL
  WHERE m.sender_id <> auth.uid()
    AND m.deleted_at IS NULL
    AND m.created_at > COALESCE(cm.last_read_at, cm.joined_at)
  GROUP BY m.conversation_id;
$$;

REVOKE ALL ON FUNCTION public.get_unread_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_unread_counts() TO authenticated;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_receipts_message ON public.message_receipts(message_id);

CREATE TABLE IF NOT EXISTS public.saved_messages (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, message_id)
);

ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_messages_select_policy ON public.saved_messages;
CREATE POLICY saved_messages_select_policy ON public.saved_messages
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS saved_messages_insert_policy ON public.saved_messages;
CREATE POLICY saved_messages_insert_policy ON public.saved_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS saved_messages_delete_policy ON public.saved_messages;
CREATE POLICY saved_messages_delete_policy ON public.saved_messages
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_messages_user ON public.saved_messages(user_id, created_at DESC);
