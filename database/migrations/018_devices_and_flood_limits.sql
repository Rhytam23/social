-- ============================================================
-- 018: multi-device cap and database-level flood limits.
-- Re-runnable. Requires 001-017.
--
-- 1. An account may register at most 3 device identities. Extra browsers
--    LINK to an existing identity (encrypted backup) instead of adding rows,
--    so this only stops row spam and repeated key swapping.
-- 2. Signed-in users can write to Supabase directly, which skips the API
--    routes' rate limits. These triggers cap writes per account inside the
--    database, so a script cannot flood messages, reactions or conversations.
--    Calls with no signed-in user (SQL editor, service role) are not limited.
-- ============================================================

CREATE OR REPLACE FUNCTION public.limit_devices_per_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-registering an identity the account already has is always fine.
  IF EXISTS (
    SELECT 1 FROM public.user_devices
    WHERE user_id = NEW.user_id AND device_id = NEW.device_id
  ) THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM public.user_devices WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'device_limit_reached' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_limit_devices_per_user ON public.user_devices;
CREATE TRIGGER trigger_limit_devices_per_user
  BEFORE INSERT ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.limit_devices_per_user();

-- Generic per-account write limit. Arguments: owner column, max rows, window in seconds.
CREATE OR REPLACE FUNCTION public.enforce_write_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id UUID;
  recent BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  owner_id := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
  IF owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  EXECUTE format(
    'SELECT count(*) FROM %I.%I WHERE %I = $1 AND created_at > now() - make_interval(secs => $2)',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_ARGV[0]
  ) INTO recent USING owner_id, TG_ARGV[2]::int;

  IF recent >= TG_ARGV[1]::int THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_write_rate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.limit_devices_per_user() FROM PUBLIC;

CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_user_created ON public.message_reactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_created ON public.conversations(created_by, created_at DESC);

DROP TRIGGER IF EXISTS trigger_rate_messages ON public.messages;
CREATE TRIGGER trigger_rate_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_rate('sender_id', '120', '60');

DROP TRIGGER IF EXISTS trigger_rate_reactions ON public.message_reactions;
CREATE TRIGGER trigger_rate_reactions
  BEFORE INSERT ON public.message_reactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_rate('user_id', '200', '60');

DROP TRIGGER IF EXISTS trigger_rate_conversations ON public.conversations;
CREATE TRIGGER trigger_rate_conversations
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_rate('created_by', '30', '3600');
