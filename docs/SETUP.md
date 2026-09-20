# Setup

How to get Private Chat running against your own Supabase project. Plan on about 15 minutes, plus 10 more if you add Google sign-in.

You need Node.js 20+, npm, and a Supabase account. Google Cloud (for Google sign-in) and Upstash (rate limiting across servers) are optional.

## 1. Create the Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **Project Settings → API** and note the **Project URL**, the **`anon` public key** and the **`service_role` secret key**.

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>

# Optional: shared rate limiting across several server instances
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- `SUPABASE_SERVICE_ROLE_KEY` bypasses all row level security. Server only. Never prefix it with `NEXT_PUBLIC_`, never commit it.
- `.env` and `.env.local` are git-ignored. A fresh clone (or another worktree or machine) has none, so copy your file over.
- Next.js reads env files only at startup. Restart `npm run dev` after any change.
- Copy the URL from the dashboard rather than typing it. One swapped letter in the project ref gives a "site can't be reached" (DNS) error. See [Troubleshooting](TROUBLESHOOTING.md#this-site-cant-be-reached--dns_probe_possible).

## 3. Run the database migrations

Open **SQL Editor → New query** and run each file from `database/migrations/` **once, in numeric order**, pasting the whole file each time.

| # | File | What it does |
|---|---|---|
| 001 | `001_initial_schema.sql` | Tables and indexes |
| 002 | `002_rls_policies.sql` | Row level security and helper functions |
| 003 | `003_security_foundation.sql` | Hardens security rules, removes group roles |
| 004 | `004_storage.sql` | Private attachment buckets and their rules |
| 005 | `005_profiles_phone_email.sql` | `email` and `phone_number` on profiles, first signup trigger |
| 006 | `006_production_hardening.sql` | Private-chat member cap, avatars bucket (its invite rule is replaced by 007) |
| 007 | `007_open_registration.sql` | Signup no longer needs an invite |
| 008 | `008_realtime_publication.sql` | Turns on live delivery for messages, reactions, receipts, members, presence |
| 009 | `009_oauth_profile_metadata.sql` | Final signup trigger: names and avatars from Google, valid unique usernames |
| 010 | `010_conversation_creator_can_read.sql` | Fixes "new row violates row-level security policy for table conversations" when starting a chat or group |
| 011 | `011_profile_fields_and_privacy.sql` | Bio, pronouns, time zone, preferences; **hides every member's email and phone from other users** |
| 012 | `012_messaging_state.sql` | Server-side unread counts, saved messages |
| 013 | `013_group_roles_threads.sql` | Group owner/admin/member roles, group description, admin-only posting, threads |
| 014 | `014_communities.sql` | Communities, channels, invite links |
| 015 | `015_privacy_controls.sql` | Disappearing messages, blocking, reports |
| 016 | `016_username_only_discovery.sql` | Stops clients calling the email/phone lookup, so people are found by username only |
| 017 | `017_security_hardening.sql` | Security fixes: blocking that works, group key envelopes only from admins, membership and message integrity guards, storage limits, realtime authorization. **Required for the security fixes to take effect.** |
| 018 | `018_devices_and_flood_limits.sql` | At most 3 registered device identities per account, and per-account write limits (messages, reactions, new conversations) enforced in the database. |

Migrations 011 to 018 are safe to re-run. The app keeps working if some of them are missing: each feature that needs one says so instead of failing. Run them in order, once each.

`database/functions/atomic_invite_consumption.sql` belongs to the removed invite feature. New installs do not need it.

**Do not re-run old migrations on an existing project.** `002` and `003` are not re-runnable: `002` refers to a column that `003` removes, so running it again fails with `column "role" does not exist`. If you are unsure what has been applied, run this read-only check and only run what is missing:

```sql
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') as m005_profile_email,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='phone_number') as m005_profile_phone,
  exists(select 1 from storage.buckets where id='encrypted_attachments') as m004_attachments_bucket,
  exists(select 1 from storage.buckets where id='avatars') as m006_avatars_bucket,
  exists(select 1 from pg_trigger where tgname='trigger_enforce_private_conversation_cap') as m006_private_cap,
  (select prosrc like '%full_name%' from pg_proc where proname='handle_new_user' limit 1) as m009_signup_trigger,
  exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='messages') as m008_realtime;
```

Every column should be `true`. `004` to `009` are safe to run again, but `005`, `006` and `007` each replace the signup function with an older version (`006` brings back the invite requirement), so **always run `009` last**. `009` replaces the signup function completely, so it is also the fix if an older signup rule is still installed.

## 4. Configure Authentication

In the Supabase dashboard, under **Authentication**:

1. **Sign In / Providers → Email**: enabled, with **Confirm email** turned **on**. This is what makes new accounts prove they own their address, and it is what stops someone pre-registering another person's email.
2. **URL Configuration**:
   - **Site URL**: `http://localhost:3000` while developing, your real address in production.
   - **Redirect URLs**: add `http://localhost:3000/auth/confirm` and `https://<your-domain>/auth/confirm`.
3. **Email sending**: the built-in mailer is limited to a few messages per hour and is meant for testing. For real use add your own SMTP under **Project Settings → Authentication → SMTP**.

## 5. Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com), create or pick a project.
2. **OAuth consent screen** (or **Google Auth Platform**): user type **External**, fill in the app name and contact emails, keep the default scopes (email, profile, openid), then **publish the app**. While it is in "Testing", only listed test users can sign in.
3. **Credentials → Create credentials → OAuth client ID → Web application**. Under **Authorized redirect URIs** paste the callback URL from Supabase (**Authentication → Sign In / Providers → Google → Callback URL**, shaped like `https://<project-ref>.supabase.co/auth/v1/callback`). Use the copy button. Leave **Authorized JavaScript origins** empty.
4. Copy the **Client ID** and **Client secret** into Supabase's Google provider page, enable it and save.
5. Make sure `009` has been run and the Redirect URLs from step 4 above are set.

Supabase links a Google login to an existing email/password account with the same verified address. There are no extra environment variables: the Google secret lives in Supabase.

## 6. Verify the storage buckets and Realtime

- **Storage** should list `encrypted_attachments` (private), `attachments` (private) and `avatars` (public). Migrations `004` and `006` create them.
- **Database → Replication** (or Publications) should show `supabase_realtime` including `messages`. Migration `008` handles this.

## 7. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, create an account, and confirm the email. **The first account created becomes the admin.**

To confirm everything works, sign up a second account in a private window, start a chat between the two, and check that messages arrive without refreshing. The full manual checklist is in [Testing](TESTING.md#manual-checklist).

## Running without a backend (demo mode)

If no Supabase variables are set, `npm run dev` starts a local demo with seeded people and messages. It is for looking at the UI only: nothing is encrypted or sent anywhere, and it is disabled in production builds.
