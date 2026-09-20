# Troubleshooting

Problems that have actually come up, with the cause and the fix.

## "Server misconfiguration: Supabase environment variables are not set."

A production build (or `npm run start`, or a deployed site) has no usable `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This is deliberate: the app refuses to run without authentication.

Set the variables (`.env.local` locally; the host's settings when deployed) and restart or redeploy. Values containing the word `placeholder` count as not set. In development (`npm run dev`) the same situation shows the demo mode instead.

## "This site can't be reached" / `DNS_PROBE_POSSIBLE`

The browser tried to open a `*.supabase.co` address that does not exist, almost always because the project ref in `NEXT_PUBLIC_SUPABASE_URL` has a typo (for example two letters swapped).

1. Copy the **Project URL** from Supabase → Project Settings → API into `.env` and `.env.local`.
2. Restart `npm run dev`. On Vercel, fix the variable and **redeploy**.

To check that a URL exists: `curl -I https://<ref>.supabase.co/auth/v1/health` should answer (`401` is fine); a DNS failure means the ref is wrong. Your anon key contains the project ref too; decode its middle section with `node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64url')).ref)" <anon key>` to see which project it belongs to.

## SQL error: `function public.is_group_admin(uuid) does not exist` (or another missing function or table)

A migration was run before the ones it depends on. `017` needs `013` to `016`; `014` needs `013`; and so on. Run the check queries in [Setup](SETUP.md#3-run-the-database-migrations) to see which migrations are missing, then run the missing ones **in numeric order**, one file at a time.

## SQL error: `column "role" does not exist`

You ran `002_rls_policies.sql` on a database that already has `003` applied. `003` removes that column. Do not re-run old migrations; see [Setup](SETUP.md#3-run-the-database-migrations) for the status check that tells you what is missing.

## SQL error: `column "email" of relation "profiles" does not exist`

Migration `005_profiles_phone_email.sql` was never applied. Run `005`, then run `009` again, because `005` installs an older version of the signup function.

## "Database error saving new user"

Supabase hides the real error when the signup trigger `handle_new_user()` fails. Common causes:
- `005` was not applied (the `email` column is missing).
- An older signup rule is installed (`006` requires an invite token). Run `009`.
- Another account already uses the same email or username.

To see the real error, run this in the SQL Editor. It creates a fake user inside a transaction and rolls it back, so nothing is saved:

```sql
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'trigger-test@example.com', '{"full_name":"Trigger Test"}'::jsonb, now(), now());
rollback;
```

A red error message names the failing statement. No error means the trigger is healthy.

## `new row violates row-level security policy for table "conversations"`

Shown when starting a chat or group. The app creates the conversation and reads it back in one step, but the read policy only allowed existing members and the creator is not a member yet. Run `database/migrations/010_conversation_creator_can_read.sql` in the Supabase SQL Editor (safe to re-run), then try again.

## "Communities need the latest database update (migration 014)"

The community rail works, but creating one failed because the database functions do not exist yet. Run `database/migrations/014_communities.sql` (and `011` to `013` before it if you skipped them) in the Supabase SQL Editor.

## Group or thread features seem missing

Roles, admin-only posting and threads need `013_group_roles_threads.sql`. Until it is applied, groups behave as before (every member can manage) and the app says roles are unavailable.

## Someone joined a community but sees no messages

Each channel key must be shared to a new member by an admin's device. Ask an admin to open the app; the key is shared automatically within a few seconds. If the admin was already open, sign out and in again on the admin's device to reconnect the live channel.

## A call rings but never connects

Both people need working microphone (and camera) permission, and the network must allow a direct connection. On strict corporate or mobile networks add a TURN relay (`TURN_URLS`, plus `TURN_SHARED_SECRET` or `TURN_USERNAME` and `TURN_CREDENTIAL`) and redeploy; see [Deployment](DEPLOYMENT.md). Calls only ring people you already have a direct chat with.

## Google sign-in problems

The login page shows a reason after "We couldn't complete Google sign-in", for example `(Reason: Database error saving new user)`. Use it with this table:

| Symptom | Cause and fix |
|---|---|
| Google page shows `redirect_uri_mismatch` | The redirect URI in Google Cloud is not exactly the callback URL shown in Supabase → Providers → Google. Copy it with the copy button |
| "Access blocked" or "app not verified" | The consent screen is in Testing. Publish it or add your account as a test user |
| `Database error saving new user` | See the section above |
| `Unable to exchange external code` | The Client Secret in Supabase is wrong or truncated. Paste it again |
| `PKCE code verifier not found` | Sign-in was started in a different browser or address (`127.0.0.1` vs `localhost`) than it returned to. Start again from one address |
| Sent back to the site without signing in | The address is missing from Supabase → Authentication → URL Configuration → Redirect URLs |
| "Google sign-in was cancelled" | You closed or denied the Google prompt |

Changes in Google Cloud can take a few minutes to apply.

## After signing in I see Vercel's "You Need Access" page

The deployment has Vercel **Deployment Protection** turned on, so only members of your Vercel team can open it. This is a hosting setting, not an app bug. Turn protection off for Production, share the production domain, and make sure Supabase's Site URL and Redirect URLs use that domain. Full steps in [Deployment](DEPLOYMENT.md#vercel-deployment-protection).

## Confirmation email does not arrive, or the link fails

- Supabase's built-in mailer allows only a few emails per hour, and shows "Too many emails have been sent recently" when exceeded. Wait, check spam, or configure your own SMTP (and raise the email rate limit) in Supabase, Project Settings, Authentication.
- The **Resend** button has a 60 second cooldown and shows Supabase's error if it is rate limited.
- "Confirmation link expired": sign in with your email and password; you will be offered a new link.
- The link only signs you in when opened in the **same browser** that signed up. Elsewhere your email is still confirmed; just sign in normally.
- "Email not confirmed" on sign-in shows the same "Check your email" screen with a resend button.

## New messages only appear after a refresh

Realtime is not delivering. The usual cause is that the tables are not in the `supabase_realtime` publication (migration `008`; `014` for communities), or Realtime is off for the project. Check with `select tablename from pg_publication_tables where pubname = 'supabase_realtime';`.

Details: Run migration `008_realtime_publication.sql`, then check Supabase → Database → Replication that `messages` is in the `supabase_realtime` publication. Also confirm you are on a build that includes live updates, and open the browser console for websocket errors.

## "[Unable to decrypt: …]" in a chat

The message was encrypted for a different key than the one this browser holds. Typical causes: you cleared site data (the key lived in the browser), or you chose "Start fresh" on some device. Restore your key backup (Settings, Security) with its passphrase. If you have no backup, earlier messages cannot be recovered.

## The app shows "Link this device" after I sign in

This browser has no encryption key, but your account already has one on another device. The app deliberately does not create a second key (that would cut your first device off). Choose the backup file you exported on the first device (Settings, Security, Export backup) and type its passphrase. If you have no backup, "Start fresh" creates a new key but your old messages become unreadable and your contacts see a "security code changed" warning. See [E2EE](E2EE.md#keys-and-linking-devices).

## Admin, Errors says "not available right now" (or is always empty)

Migration `019_admin_logs.sql` has not been applied, so the tables `error_logs` and `admin_audit_log` do not exist. Run it after `001` to `018`, then reload. If it is applied but stays empty: nothing has failed yet, the app is running in demo mode (nothing is collected without Supabase), or `SUPABASE_SERVICE_ROLE_KEY` is not set on the server (the server needs it to write the log). Only platform admins can see the tab.

## `device_limit_reached`

An account can register at most 3 keys (migration `018`). This appears if something repeatedly created new keys. In the SQL editor, `select device_id, last_seen_at from user_devices where user_id = '<id>';` shows them; delete the stale ones you do not use, then link with the backup instead of creating new keys.

## `rate_limit_exceeded` or "Rate limit exceeded."

You hit a limit: too many requests from one address or account (HTTP 429, wait for the `Retry-After` seconds), or more than 120 messages a minute, 200 reactions a minute or 30 new conversations an hour from one account (database triggers from `018`). Normal use does not reach these. The limits are in `lib/api/security.ts`, `middleware.ts` and `018_devices_and_flood_limits.sql`.

## Typing indicators or calls stop working after applying migration 017

They now use private Realtime channels that need Realtime Authorization and the `pc_*` policies on `realtime.messages`. Confirm the policies exist (the check query in [Setup](SETUP.md#3-run-the-database-migrations)) and that Realtime Authorization is on for the project (Project Settings, Realtime). Also confirm `017` really ran: its realtime part is skipped silently if `realtime.messages` does not exist.

## A blocked user can still message me

The fix for blocking is in migration `017`. Apply it and check that `is_blocked_in_conversation` exists.

## A group member cannot read messages

They probably have not signed in since joining, so no key has been published for them, and the group key could not be sealed to them. Ask them to sign in, then add them again or send a message after they have joined so the key is re-shared.

## `npm` warns about `allow-scripts` (esbuild, unrs-resolver)

Newer npm versions warn about install scripts they have not been told to trust. The two packages are build tooling (`esbuild` via Vitest, `unrs-resolver` via the Next.js ESLint setup). It is a warning, not an error. To silence it, approve them with `npm approve-scripts esbuild unrs-resolver` and commit the resulting change.

## `npm run build` fails on Windows with `spawn UNKNOWN` or out of memory

Stop the dev server first, then build.

## Vercel shows "Needs Attention" on `SUPABASE_SERVICE_ROLE_KEY`

Vercel wants secret-looking variables marked **Sensitive**. Edit the variable, turn on Sensitive, save, and redeploy. The name must not start with `NEXT_PUBLIC_`.

## A page does not scroll

The chat shell is a fixed full-height layout; every other page scrolls normally. If a public page does not scroll, check for a stray `overflow: hidden` on `html` or `body` in `app/globals.css`.

## Demo data appears in development

`npm run dev` with no Supabase variables runs the demo mode. Set the three variables and restart to use the real backend.
