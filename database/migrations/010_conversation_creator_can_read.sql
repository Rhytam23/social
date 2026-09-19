-- 010: let a conversation's creator read it, so creating one no longer fails
-- with: new row violates row-level security policy for table "conversations".
--
-- Cause: the API creates a conversation with INSERT ... RETURNING. Postgres
-- checks the RETURNING row against the SELECT policy, which only allowed
-- members (is_conversation_member) and admins. At that moment the creator has
-- not been added to conversation_members yet, so the check failed and the
-- whole INSERT was rejected.
--
-- Safe to re-run. Creators only ever see conversations they created
-- (conversations_insert_policy already forces created_by = auth.uid()).

DROP POLICY IF EXISTS conversations_select_policy ON public.conversations;

CREATE POLICY conversations_select_policy ON public.conversations
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_conversation_member(id)
    OR public.is_admin()
  );
