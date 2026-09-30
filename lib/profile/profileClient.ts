import type { SupabaseClient, User } from '@supabase/supabase-js';
import { UserMessageError } from '../ui/errors';

/** Columns that exist since the first schema. */
const BASE_PROFILE_COLUMNS = 'id, username, display_name, avatar_url, is_admin';
/** Columns added by migration 011. Read separately so the app still works before it is applied. */
const EXTRA_PROFILE_COLUMNS = 'bio, pronouns, timezone, preferences, onboarding_completed';

export interface OwnProfile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  is_admin?: boolean;
  bio?: string | null;
  pronouns?: string | null;
  timezone?: string | null;
  preferences?: Record<string, unknown>;
  onboarding_completed?: boolean;
  /** False until the person has chosen their own username (migration 030). Undefined before that migration. */
  username_set?: boolean;
  email?: string;
  phone_number?: string | null;
}

/**
 * Loads the signed-in user's profile in three independent steps, so a missing
 * migration degrades to fewer fields instead of failing the whole sign-in:
 * base columns, then migration-011 columns, then private contact details.
 */
export async function loadOwnProfile(supabase: SupabaseClient, user: User): Promise<OwnProfile | null> {
  const { data: base } = await supabase.from('profiles').select(BASE_PROFILE_COLUMNS).eq('id', user.id).maybeSingle();
  if (!base) return null;
  const profile: OwnProfile = { ...(base as OwnProfile), email: user.email ?? undefined };

  try {
    const { data: extra, error } = await supabase.from('profiles').select(EXTRA_PROFILE_COLUMNS).eq('id', user.id).maybeSingle();
    if (!error && extra) Object.assign(profile, extra);
  } catch {
    // migration 011 not applied yet
  }

  try {
    const { data: chosen, error } = await supabase.from('profiles').select('username_set').eq('id', user.id).maybeSingle();
    if (!error && chosen) profile.username_set = (chosen as { username_set: boolean }).username_set;
  } catch {
    // migration 030 not applied yet: nobody is asked to choose a username
  }

  try {
    const { data: contact, error } = await supabase.rpc('get_my_contact');
    const row = Array.isArray(contact) ? contact[0] : contact;
    if (!error && row) {
      profile.phone_number = (row as { phone_number: string | null }).phone_number;
      if ((row as { email: string | null }).email) profile.email = (row as { email: string }).email;
    }
  } catch {
    // migration 011 not applied yet
  }
  return profile;
}

export interface ProfilePatch {
  display_name?: string;
  username?: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  timezone?: string | null;
  preferences?: Record<string, unknown>;
  onboarding_completed?: boolean;
}

const EXTRA_KEYS: (keyof ProfilePatch)[] = ['bio', 'pronouns', 'timezone', 'preferences', 'onboarding_completed'];

/** Saves profile fields. Fields from migration 011 are written separately and reported if unavailable. */
export async function saveOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: ProfilePatch
): Promise<{ extrasSaved: boolean }> {
  const base: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    (EXTRA_KEYS.includes(k as keyof ProfilePatch) ? extra : base)[k] = v;
  }

  if (Object.keys(base).length > 0) {
    if (typeof base.username === 'string') base.username = base.username.trim().toLowerCase();
    const { error } = await supabase.from('profiles').update(base).eq('id', userId);
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505') throw new UserMessageError('That username or phone number is already taken.');
      if (code === 'P0001' && error.message) throw new UserMessageError(error.message);
      throw new Error(error.message);
    }
  }
  if (Object.keys(extra).length === 0) return { extrasSaved: true };

  const { error } = await supabase.from('profiles').update(extra).eq('id', userId);
  return { extrasSaved: !error };
}

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

/** Returns an error message, or null when the username is acceptable. */
export function validateUsername(value: string): string | null {
  const v = value.trim();
  if (v.length < 3) return 'Usernames need at least 3 characters.';
  if (v.length > 30) return 'Usernames can be at most 30 characters.';
  if (!USERNAME_RE.test(v)) return 'Use letters, numbers, dots and underscores only.';
  return null;
}
