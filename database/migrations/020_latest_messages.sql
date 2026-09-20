-- 020: the newest message of each conversation, in one query.
--
-- The sidebar shows a preview line per conversation. Loading it used to cost one request
-- (and one database round trip) per conversation. This function answers for all of them at once.
--
-- It is SECURITY INVOKER (the default), so row level security still decides what the caller may see:
-- messages_select_policy only returns rows from conversations the caller belongs to. Nothing about
-- who may read what changes, and no message text is involved (the rows hold ciphertext only).
--
-- Needs 001 to 019. Safe to run twice. The app works without it (it falls back to one request per
-- conversation), so applying it is an optimisation, not a requirement.

CREATE OR REPLACE FUNCTION public.get_latest_messages(p_conversation_ids UUID[])
RETURNS SETOF public.messages
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.conversation_id) m.*
  FROM public.messages m
  WHERE m.conversation_id = ANY (p_conversation_ids)
  ORDER BY m.conversation_id, m.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_latest_messages(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_latest_messages(UUID[]) TO authenticated;
