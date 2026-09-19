-- Migration: 009_oauth_profile_metadata.sql
-- Description: Profile creation for sign-in providers such as Google.
--   1. Display name falls back through display_name -> full_name -> name ->
--      email local part (Google supplies full_name/name, not display_name).
--   2. avatar_url is taken from avatar_url or picture (Google's field).
--   3. Usernames are made valid and unique. profiles.username is UNIQUE with a
--      3-character minimum, and it used to be copied straight from the email
--      local part, so alex@gmail.com and alex@yahoo.com (or jo@x.com) made the
--      whole signup fail with "Database error saving new user".
--   The first account is still bootstrapped as admin (see 007).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_short_id TEXT;
  v_base TEXT;
  v_username TEXT;
  v_display_name TEXT;
  v_avatar TEXT;
BEGIN
  v_is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);
  v_short_id := substr(replace(NEW.id::text, '-', ''), 1, 6);

  v_base := lower(regexp_replace(
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    '[^a-zA-Z0-9_.]', '', 'g'
  ));
  IF char_length(v_base) < 3 THEN
    v_base := 'user_' || v_short_id;
  END IF;

  v_username := v_base;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id <> NEW.id) THEN
    v_username := v_base || '_' || v_short_id;
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

  INSERT INTO public.profiles (id, username, display_name, avatar_url, email, phone_number, is_admin)
  VALUES (NEW.id, v_username, v_display_name, v_avatar, NEW.email, NEW.phone, v_is_first_user)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
