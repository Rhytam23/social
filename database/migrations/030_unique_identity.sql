-- Migration: 030_unique_identity.sql
-- Description: no duplicate people, and a username every person chooses themselves.
--
--   1. Usernames are unique regardless of letter case ("Alice" and "alice" were two different people before,
--      because the column's UNIQUE constraint is case sensitive). Existing clashes are renamed, never deleted.
--   2. Usernames are stored lowercase, 3 to 30 characters of a-z 0-9 _ . (the same rule the app uses).
--   3. Email and phone number are unique after trimming and lowercasing (blank phone numbers become NULL).
--   4. profiles.username_set says whether the person has chosen their username. Accounts created before this
--      migration, or with a generated name (user_ab12cd, or the start of the email address), are asked once.
--   5. A person may change their username once per 14 days (the first choice is free). Platform admins and the
--      server (no signed-in user) are not limited.
--   6. handle_new_user() no longer fails a sign-up when a name clashes: it picks a free name instead.
--   7. available_usernames(): server-only lookup used by GET /api/users/username-available.
--
-- Safe to re-run. Apply after 029.

-- ---- columns ---------------------------------------------------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_set BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

-- The app reads username_set for the signed-in person (column-level grants, see 011).
GRANT SELECT (username_set) ON public.profiles TO authenticated;

-- ---- clean existing data before adding the rules ---------------------------------------------------------------

-- Two profiles with the same email or phone once case and spacing are ignored: the oldest keeps it. The others
-- lose only this copy of the value (the sign-in address itself lives in auth.users and is untouched). This runs
-- BEFORE normalising, because the old case-sensitive UNIQUE constraints would reject the normalising update.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY lower(btrim(email)) ORDER BY created_at, id) AS rn FROM public.profiles WHERE NULLIF(btrim(email), '') IS NOT NULL
)
UPDATE public.profiles p SET email = NULL FROM ranked r WHERE p.id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY btrim(phone_number) ORDER BY created_at, id) AS rn FROM public.profiles WHERE NULLIF(btrim(phone_number), '') IS NOT NULL
)
UPDATE public.profiles p SET phone_number = NULL FROM ranked r WHERE p.id = r.id AND r.rn > 1;

-- Now normalise (blank becomes NULL).
UPDATE public.profiles SET email = NULLIF(lower(btrim(email)), '') WHERE email IS DISTINCT FROM NULLIF(lower(btrim(email)), '');
UPDATE public.profiles SET phone_number = NULLIF(btrim(phone_number), '') WHERE phone_number IS DISTINCT FROM NULLIF(btrim(phone_number), '');

-- Usernames: lowercase, strip characters the app does not allow, and give case-insensitive clashes a suffix
-- (the oldest profile keeps the name). Done in two steps through temporary names, because the old case-sensitive
-- UNIQUE constraint would reject a row that is renamed to a name another row still holds.
DROP TABLE IF EXISTS pg_temp.username_plan;
CREATE TEMP TABLE username_plan AS
WITH cleaned AS (
  SELECT id, created_at, username AS old_name,
         CASE
           WHEN char_length(regexp_replace(lower(username), '[^a-z0-9_.]', '', 'g')) >= 3
             THEN left(regexp_replace(lower(username), '[^a-z0-9_.]', '', 'g'), 30)
           ELSE 'user_' || substr(replace(id::text, '-', ''), 1, 6)
         END AS clean
  FROM public.profiles
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY clean ORDER BY created_at, id) AS rn FROM cleaned
)
SELECT id, old_name,
       CASE WHEN rn = 1 THEN clean ELSE left(clean, 23) || '_' || substr(replace(id::text, '-', ''), 1, 6) END AS new_name
FROM ranked;

DELETE FROM pg_temp.username_plan WHERE new_name = old_name;
UPDATE public.profiles p SET username = 'tmp' || replace(p.id::text, '-', '') FROM pg_temp.username_plan u WHERE p.id = u.id;
UPDATE public.profiles p SET username = u.new_name FROM pg_temp.username_plan u WHERE p.id = u.id;
DROP TABLE IF EXISTS pg_temp.username_plan;

-- Who already has a username of their own choosing? Not the generated ones.
UPDATE public.profiles p
SET username_set = TRUE
WHERE NOT p.username_set
  AND p.username !~ '^user_[0-9a-f]{6}$'
  AND p.username IS DISTINCT FROM left(lower(regexp_replace(split_part(COALESCE(p.email, ''), '@', 1), '[^a-zA-Z0-9_.]', '', 'g')), 30);

-- ---- constraints -----------------------------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_key ON public.profiles (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_key ON public.profiles (phone_number) WHERE phone_number IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_.]{3,30}$');

-- ---- username rules on every write -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_username_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_by_person BOOLEAN := auth.uid() IS NOT NULL AND auth.uid() = NEW.id;
BEGIN
  -- Always stored lowercase and trimmed, so "Alice " and "alice" are the same name.
  NEW.username := lower(btrim(NEW.username));
  NEW.email := NULLIF(lower(btrim(NEW.email)), '');
  NEW.phone_number := NULLIF(btrim(NEW.phone_number), '');

  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF v_by_person AND NOT COALESCE(NEW.is_admin, FALSE) THEN
      IF OLD.username_set AND OLD.username_changed_at IS NOT NULL AND OLD.username_changed_at > NOW() - INTERVAL '14 days' THEN
        RAISE EXCEPTION 'You can change your username once every 14 days.' USING ERRCODE = 'P0001';
      END IF;
      NEW.username_set := TRUE;
      NEW.username_changed_at := NOW();
    END IF;
  ELSIF v_by_person AND NEW.username_set IS DISTINCT FROM OLD.username_set THEN
    -- Nobody flips the flag by hand. Confirming the suggested name goes through a normal username update.
    NEW.username_set := OLD.username_set;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_profile_username_rules ON public.profiles;
CREATE TRIGGER trigger_profile_username_rules
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_username_rules();

-- ---- sign-up: never fail on a name clash ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_short_id TEXT;
  v_chosen TEXT;
  v_base TEXT;
  v_username TEXT;
  v_display_name TEXT;
  v_avatar TEXT;
  v_try INT := 0;
BEGIN
  v_is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);
  v_short_id := substr(replace(NEW.id::text, '-', ''), 1, 6);

  v_chosen := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
  v_base := left(lower(regexp_replace(
    COALESCE(v_chosen, split_part(COALESCE(NEW.email, ''), '@', 1)),
    '[^a-zA-Z0-9_.]', '', 'g'
  )), 30);
  IF char_length(v_base) < 3 THEN
    v_base := 'user_' || v_short_id;
  END IF;

  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'User ' || v_short_id
  );

  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', '')
  );

  v_username := v_base;
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username, display_name, avatar_url, email, phone_number, is_admin, username_set)
      VALUES (NEW.id, v_username, v_display_name, v_avatar, NULLIF(lower(btrim(NEW.email)), ''), NULLIF(btrim(NEW.phone), ''), v_is_first_user, FALSE)
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, updated_at = NOW();
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_try := v_try + 1;
      IF v_try > 5 THEN
        v_username := 'user_' || v_short_id || substr(md5(random()::text), 1, 4);
      ELSE
        v_username := left(v_base, 23) || '_' || substr(md5(random()::text || NEW.id::text), 1, 6);
      END IF;
      IF v_try > 8 THEN RAISE; END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---- availability lookup (server only) --------------------------------------------------------------------------

-- Returns the candidates that are free and allowed. Only the server (service key) can call it, behind the
-- per-account limits in the API route, so it cannot be used to walk the directory.
CREATE OR REPLACE FUNCTION public.available_usernames(p_candidates TEXT[])
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(c ORDER BY ord), ARRAY[]::TEXT[])
  FROM (
    SELECT lower(c) AS c, ord
    FROM unnest(p_candidates[1:12]) WITH ORDINALITY AS t(c, ord)
    WHERE lower(c) ~ '^[a-z0-9_.]{3,30}$'
      AND NOT public.looks_official(lower(c))
      AND lower(c) <> ALL (ARRAY['admin', 'administrator', 'root', 'support', 'staff', 'nook', 'moderator', 'official', 'system'])
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(c))
  ) s;
$$;

REVOKE ALL ON FUNCTION public.available_usernames(TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.available_usernames(TEXT[]) TO service_role;
