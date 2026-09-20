-- ============================================================
-- 026: message requests. A person you have never talked to can send at most 3 messages in a direct chat
-- until you reply; once you have replied, the chat is normal.
-- Re-runnable. Requires 001-025.
--
-- How it is counted: the state lives on the conversation, not on the messages. Counting messages would be
-- undone by deleting them (members may delete their own) or by disappearing messages, and counting on the
-- member row would be undone by leaving and being re-added. Clients cannot update direct conversations (only
-- group admins of GROUP conversations and platform admins can), so this state cannot be edited from the app.
--
--   intro_sender  who sent the first message
--   intro_count   how many messages that person has sent while the other person had not replied
--   replied       true once the other person has sent anything (or a platform admin started the chat)
--
-- Direct chats only (type 'private'). Groups and channels are unaffected. Platform admins are not limited and
-- their messages count as opening a normal conversation.
-- ============================================================

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS intro_sender UUID,
  ADD COLUMN IF NOT EXISTS intro_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replied BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing direct chats: rebuild the state from what has been sent so far.
UPDATE public.conversations c
SET
  intro_sender = f.sender_id,
  intro_count = (SELECT count(*) FROM public.messages m WHERE m.conversation_id = c.id AND m.sender_id = f.sender_id),
  replied = EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id AND m.sender_id <> f.sender_id)
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, sender_id
  FROM public.messages
  ORDER BY conversation_id, created_at ASC
) f
WHERE c.id = f.conversation_id
  AND c.type = 'private'
  AND c.intro_sender IS NULL;

CREATE OR REPLACE FUNCTION public.enforce_message_request_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_admin BOOLEAN;
BEGIN
  -- Lock the row so two messages sent at the same moment cannot both slip under the limit.
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id FOR UPDATE;
  IF NOT FOUND OR v_conv.type <> 'private' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(is_admin, FALSE) INTO v_admin FROM public.profiles WHERE id = NEW.sender_id;
  IF v_admin THEN
    UPDATE public.conversations SET replied = TRUE WHERE id = v_conv.id AND NOT replied;
    RETURN NEW;
  END IF;

  IF v_conv.replied THEN
    RETURN NEW;
  END IF;

  IF v_conv.intro_sender IS NULL THEN
    UPDATE public.conversations SET intro_sender = NEW.sender_id, intro_count = 1 WHERE id = v_conv.id;
  ELSIF v_conv.intro_sender = NEW.sender_id THEN
    IF v_conv.intro_count >= 3 THEN
      RAISE EXCEPTION 'message_request_limit' USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.conversations SET intro_count = intro_count + 1 WHERE id = v_conv.id;
  ELSE
    UPDATE public.conversations SET replied = TRUE WHERE id = v_conv.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_message_request_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trigger_message_request_limit ON public.messages;
CREATE TRIGGER trigger_message_request_limit
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_request_limit();

-- The three columns are private bookkeeping: nobody edits them through the API.
CREATE OR REPLACE FUNCTION public.guard_message_request_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- A change made by enforce_message_request_limit() runs one trigger level deeper than a change from the API.
  IF pg_trigger_depth() < 2
     AND auth.uid() IS NOT NULL
     AND (NEW.intro_sender IS DISTINCT FROM OLD.intro_sender
          OR NEW.intro_count IS DISTINCT FROM OLD.intro_count
          OR NEW.replied IS DISTINCT FROM OLD.replied) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_message_request_columns ON public.conversations;
CREATE TRIGGER trigger_guard_message_request_columns
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_request_columns();
