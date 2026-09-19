-- 016: people are found by exact username only.
--
-- Migration 011 added find_profiles_by_contact(), an exact email / phone lookup
-- that any signed-in user could call. Discovery is now username-only
-- (GET /api/users?username=...), so nobody should be able to test whether an
-- email address or phone number is registered. This removes the ability to
-- call it from a client. The function itself is left in place, unused.
--
-- Safe to re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'find_profiles_by_contact'
  ) THEN
    REVOKE ALL ON FUNCTION public.find_profiles_by_contact(TEXT) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
