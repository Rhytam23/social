-- 011: richer profiles, per-user preferences, and stop leaking email / phone.
--
-- 1. New profile fields: bio, pronouns, timezone, preferences (jsonb),
--    onboarding_completed.
-- 2. profiles used to allow SELECT of every column to every signed-in user,
--    which exposed every member's email and phone number. Column-level
--    privileges now hide email and phone_number from everyone but the
--    server. The owner reads their own through get_my_contact().
--    NOTE: any future profiles column that other members should see must be
--    added to the GRANT SELECT list below.
-- 3. find_profiles_by_contact(): exact-match lookup by email or phone so
--    "find a friend by their email" keeps working without letting anyone
--    enumerate or partially search addresses.
--
-- Safe to re-run.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
-- Existing accounts have already been through onboarding; only new ones should see it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE public.profiles SET onboarding_completed = TRUE;
  END IF;
END
$$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_bio_length;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 280);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pronouns_length;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pronouns_length CHECK (pronouns IS NULL OR char_length(pronouns) <= 30);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_timezone_length;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_timezone_length CHECK (timezone IS NULL OR char_length(timezone) <= 64);

-- Column-level read access: everything except email and phone_number.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, username, display_name, avatar_url, is_admin, created_at, updated_at,
  bio, pronouns, timezone, preferences, onboarding_completed
) ON public.profiles TO authenticated;

-- The owner's own contact details.
CREATE OR REPLACE FUNCTION public.get_my_contact()
RETURNS TABLE (email TEXT, phone_number TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.phone_number FROM public.profiles p WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_contact() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_contact() TO authenticated;

-- Exact-match discovery by email or phone (at most 5 rows, never yourself).
CREATE OR REPLACE FUNCTION public.find_profiles_by_contact(p_query TEXT)
RETURNS TABLE (id UUID, username TEXT, display_name TEXT, avatar_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_url, p.created_at
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND (
      (position('@' in p_query) > 0 AND lower(p.email) = lower(trim(p_query)))
      OR (
        length(regexp_replace(p_query, '\D', '', 'g')) >= 7
        AND regexp_replace(COALESCE(p.phone_number, ''), '\D', '', 'g') = regexp_replace(p_query, '\D', '', 'g')
      )
    )
  LIMIT 5;
$$;

REVOKE ALL ON FUNCTION public.find_profiles_by_contact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_profiles_by_contact(TEXT) TO authenticated;
