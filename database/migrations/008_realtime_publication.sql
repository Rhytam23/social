-- Migration: 008_realtime_publication.sql
-- Description: Supabase Realtime only delivers postgres_changes events for
--   tables that are members of the `supabase_realtime` publication. No earlier
--   migration added any, so live delivery depended on someone having toggled
--   Realtime in the dashboard by hand. This makes it part of the schema
--   (idempotent, safe to re-run). Row Level Security still decides which rows
--   each subscriber may receive.
--
--   Tables added:
--     messages             live new messages, edits and soft-deletes
--     message_reactions    live reactions
--     message_receipts     delivered/read receipts
--     conversation_members being added to / removed from a conversation
--     presence             online status and custom status

DO $$
DECLARE
  t TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['messages', 'message_reactions', 'message_receipts', 'conversation_members', 'presence']
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

-- UPDATE events can only be filtered on non-key columns (conversation_id) when
-- the old row image is available.
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
