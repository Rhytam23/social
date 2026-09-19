-- Migration: 007_open_registration.sql
-- Description: Registration no longer requires an invitation token.
--   006 made handle_new_user() raise an exception for any signup without a
--   valid invite token, which would reject every account created from the
--   token-free signup form. This replaces it with a plain profile-creation
--   trigger. Email confirmation is enforced by Supabase Auth itself
--   (Authentication > Providers > Email > "Confirm email" must be enabled).
--   The first account on a fresh install is still bootstrapped as admin.
--   The invites table is left untouched.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_first_user BOOLEAN;
BEGIN
  v_is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);

  INSERT INTO public.profiles (id, username, display_name, email, phone_number, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'user_' || substr(NEW.id::text, 1, 6)), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'User ' || substr(NEW.id::text, 1, 4)), '@', 1)),
    NEW.email,
    NEW.phone,
    v_is_first_user
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
