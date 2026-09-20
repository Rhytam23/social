# Database

The schema is defined only by the SQL files in `database/migrations/`. This page describes the **final state after migrations 001 to 022 and 025**. `types/database.ts` mirrors it and must be updated with every schema change.

## Migrations

Run each file once, in order, in the Supabase SQL Editor. Full instructions and a status check query are in [Setup](SETUP.md#3-run-the-database-migrations).

| File | Purpose | Safe to re-run? |
|---|---|---|
| `001_initial_schema.sql` | `uuid-ossp`, ten tables, indexes | Yes |
| `002_rls_policies.sql` | Enables RLS; helper functions; first policies; admin-escalation trigger | **No.** `CREATE POLICY` has no `DROP IF EXISTS`, and it references the `role` column that `003` removes |
| `003_security_foundation.sql` | Removes group roles and `is_group_admin`; hardens `is_admin`; adds `shares_conversation_with` and `is_valid_group_key_recipient`; replaces policies; `updated_at` triggers | **Partly.** Several `CREATE POLICY` statements fail if run twice |
| `004_storage.sql` | Buckets `encrypted_attachments` and `attachments` and their policies | Yes |
| `005_profiles_phone_email.sql` | `phone_number` and `email` on `profiles`; first `handle_new_user` | Yes |
| `006_production_hardening.sql` | `pgcrypto`; 2-member cap on private chats; `avatars` bucket. Its invite-enforcing `handle_new_user` is replaced by `007` | Yes (but reinstalls the invite rule until `009` runs again) |
| `007_open_registration.sql` | `handle_new_user` without the invite requirement | Yes |
| `008_realtime_publication.sql` | Adds tables to the Realtime publication; `REPLICA IDENTITY FULL` on two tables | Yes |
| `009_oauth_profile_metadata.sql` | Final `handle_new_user` | Yes. Run it last after re-running `005`-`007` |
| `010_conversation_creator_can_read.sql` | Conversation creators can read their own conversation, fixing "new row violates row-level security policy for table conversations" when starting a chat | Yes |
| `011_profile_fields_and_privacy.sql` | `bio`, `pronouns`, `timezone`, `preferences`, `onboarding_completed` on `profiles`; **column-level read access hides `email` and `phone_number`**; `get_my_contact()`, `find_profiles_by_contact()` | Yes |
| `012_messaging_state.sql` | `conversation_members.last_read_at`, `get_unread_counts()`, `saved_messages` | Yes |
| `013_group_roles_threads.sql` | `conversation_members.role`, `conversations.description` / `only_admins_post`, `messages.thread_root_id`, `is_group_admin()`, `is_group_owner()`, role guard trigger, tighter member and group policies | Yes |
| `014_communities.sql` | `communities`, `community_members`, `community_invites`, channels as `conversations` of type `channel`; seven functions (`create_community`, `create_channel`, `join_community`, ...) | Yes |
| `015_privacy_controls.sql` | `conversations.disappear_after`, `messages.expires_at` (trigger), `purge_expired_messages()`, `set_disappearing()`, `blocks`, `reports`; messages insert rule refuses blocked senders | Yes |
| `016_username_only_discovery.sql` | Revokes client access to `find_profiles_by_contact()` (people are found by exact username only) | Yes |
| `017_security_hardening.sql` | Security fixes from the September 2026 audit: `conversation_has_members()`, creator-only-while-empty membership insert, `guard_membership_identity`, group key envelopes only from group admins, `is_blocked_in_conversation()` and a working blocking rule, `guard_message_columns` and `guard_receipt_identity` triggers, storage size and type limits, invite caps, an avatar URL allow-list, and Realtime Authorization policies for the typing and call channels | Yes |
| `018_devices_and_flood_limits.sql` | At most 3 registered device keys per account (`limit_devices_per_user`); per-account write limits inside the database (`enforce_write_rate`: 120 messages and 200 reactions per minute, 30 new conversations per hour) | Yes |
| `025_admin_lock_and_roles.sql` | Two kinds of admin. **`is_admin` can no longer be changed by any API role, including the service role**; the only way is the Supabase dashboard or SQL editor, and each change is written to the admin activity log. Group and community admins can make members admins (owners do everything else); a community holds at most 10 channels; official-looking names ("admin", "staff", a check mark, reserved handles) can only belong to platform admins | Yes |
| `022_support_requests.sql` | The support inbox: table `support_requests` (readable by platform admins only, no client writes), the server-only function `submit_support_request()` (validates, allows at most 5 requests a day per email, keeps 90 days and 5,000 rows), and `admin_set_support_status()` (admins only, audited) | Yes |
| `021_upload_limits.sql` | Attachments only through signed uploads: drops the client upload policy, sets the bucket ceiling (100 MB) and the avatar limit (2 MB, images), adds `uploaded_bytes_last_day()` for the daily quota. **Deploy the matching app version before running it** | Yes |
| `020_latest_messages.sql` | `get_latest_messages(uuid[])`: the newest message of each conversation in one query, for the sidebar previews. Runs with the caller's own rights, so row level security decides what is returned. Optional: without it the app makes one request per conversation | Yes |
| `019_admin_logs.sql` | The admin error log and admin activity log: tables `error_logs` and `admin_audit_log` (readable by platform admins only), the server-only ingest functions `log_error()` and `log_admin_action()`, and the admin actions `admin_set_error_status()` and `admin_clear_errors()`. 30-day retention and a 5,000-row cap | Yes |

## Tables

All tables have row level security enabled.

| Table | Purpose and notable constraints |
|---|---|
| `profiles` | One per user; `id` references `auth.users` (cascade). `username` unique, at least 3 characters. `display_name`, `avatar_url`, `is_admin` (default false), `email` unique, `phone_number` unique |
| `invites` | **Unused.** Left over from the removed invitation feature (token hash, status). The app no longer reads or writes it; it can be dropped in a future migration |
| `conversations` | `type` is `private` or `group`; a group must have a name |
| `conversation_members` | Primary key (`conversation_id`, `user_id`); `joined_at`, `left_at`; `role` (`owner`, `admin`, `member`, from `013`); `last_read_at` (`012`) |
| `messages` | `ciphertext` and `nonce` required, **no plaintext column**; `encryption_version`; `reply_to_message_id`; `thread_root_id`; `expires_at`; `edited_at`, `deleted_at` (soft delete). Since `017` only the ciphertext, nonce, version, `edited_at` and `deleted_at` can change after insert |
| `message_reactions` | Primary key (`message_id`, `user_id`, `reaction`) |
| `message_receipts` | Primary key (`message_id`, `user_id`); `delivered_at`, `read_at`. Created, not yet used by the app |
| `user_devices` | Public keys only (`identity_public_key`, `signed_prekey`); unique per (`user_id`, `device_id`). At most 3 rows per account (`018`). Linked devices share one key, so normally an account has one row ([E2EE](E2EE.md#keys-and-linking-devices)) |
| `group_key_envelopes` | Group key sealed to one device; unique per (`conversation_id`, `user_id`, `device_id`, `key_version`) |
| `presence` | `online`, `last_seen`. Created, not yet used by the app (live presence uses a Realtime channel) |
| `saved_messages` | (`012`) A user's bookmarks: message ids only |
| `communities`, `community_members`, `community_invites` | (`014`) Communities and their members; invites are stored hashed. Channels are `conversations` rows of type `channel` |
| `blocks`, `reports` | (`015`) Who blocked whom (visible only to the blocker); message reports (readable only by platform admins) |
| `error_logs` | (`019`) One row per distinct error, server or browser, with an occurrence counter, who was affected, and open/resolved status. Fingerprint is unique so a repeated error is one row. Readable by admins only |
| `admin_audit_log` | (`019`) Append-only record of admin actions (who promoted whom, who resolved or cleared errors). Readable by admins only; nobody can edit or delete it through the API |

A private conversation can have at most two active members (trigger from `006`, on insert only).

## Functions and triggers

All are `SECURITY DEFINER` with a fixed `search_path`; helpers are executable by `authenticated` and `service_role` only.

- **`handle_new_user()`**, trigger `on_auth_user_created` on `auth.users` (final version from `009`). Creates the profile for every new account, from email, password or Google:
  - The **first** profile ever created gets `is_admin = true`.
  - Username comes from `raw_user_meta_data.username` or the email's local part, stripped to `[a-zA-Z0-9_.]` and lower-cased; shorter than 3 characters becomes `user_<id>`; a collision appends `_<id>`.
  - Display name falls back through `display_name`, `full_name`, `name`, the email local part.
  - Avatar comes from `avatar_url` or `picture` (Google).
  - No invite is needed. If this function raises, Supabase reports "Database error saving new user".
- **`is_admin()`** reads only `profiles.is_admin` for the caller. It never trusts JWT metadata.
- **`is_conversation_member(uuid)`**: the caller has an active membership (`left_at` is null).
- **`shares_conversation_with(uuid)`**: the caller and the other user are active in a common conversation.
- **`is_valid_group_key_recipient(conversation, user, device)`**: a group, an active member, and a device belonging to that user.
- **`prevent_profile_admin_escalation()`**: on `profiles`, no API role (signed in, anonymous or the service role) can set or change `is_admin`; since `025` only a connection that does not switch role (the Supabase dashboard, the SQL editor, migrations, the auth service) can. Signed-in callers are silently reverted; the service role gets an error. Signed-in callers cannot set or change `is_admin`. Direct database and service-role changes (including the first-user bootstrap) are allowed.
- **`enforce_private_conversation_cap()`**: rejects a third active member in a private conversation.
- **`set_updated_at()`**: keeps `updated_at` current on several tables.
- **`consume_invite(...)`**: atomic single-use invite redemption, `service_role` only. **Unused** since the invite feature was removed. It exists only in projects where the old `functions/atomic_invite_consumption.sql` script was run (that file has been deleted); it can be dropped together with the `invites` table.

## Row level security summary

| Table | Read | Write |
|---|---|---|
| `profiles` | Any signed-in user | Update own row only. No client insert or delete |
| `invites` | Admin | Admin |
| `conversations` | Members, admins | Insert as creator; update by any member or admin; delete by admin |
| `conversation_members` | Members, admins | Insert: the creator **only while the conversation has no members yet**, or a group admin (`017`). Update and delete: own row, or admin. A trigger stops moving a row to another conversation or user |
| `messages` | Members | Insert as yourself if a member, not blocked, and allowed to post (`017`). Update and delete only your own messages, and only content columns. Writes are rate limited per account (`018`) |
| `message_reactions` | Members | Insert as yourself if a member; delete your own |
| `message_receipts` | Members | Insert and update your own |
| `user_devices` | Yourself, and people you share a conversation with | Insert, update, delete your own |
| `error_logs`, `admin_audit_log` | Platform admins only | **No client writes at all.** Rows are created by server-only functions and changed only by two admin functions that check `is_admin()` and write an audit row |
| `group_key_envelopes` | Your own rows, if a member | Insert **only by a group owner or admin** for a valid recipient device (`017`) |
| `presence` | Yourself, and people you share a conversation with | Insert and update your own |

Remaining caveat, recorded in [Security](SECURITY.md#known-gaps): any signed-in user can read the non-private `profiles` columns (username, display name, photo, bio) with the API, so "find people by exact username only" is enforced by the app, not by row level security. Email and phone are hidden by column privileges (`011`).

## Storage

| Bucket | Visibility | Contents and rules |
|---|---|---|
| `encrypted_attachments` | Private | Encrypted files uploaded by the app at `<conversationId>/<timestamp>_<name>`. Read and write only for members of that conversation (first path segment) |
| `attachments` | Private | Created by `004` with the same rules; the app currently uses `encrypted_attachments` |
| `avatars` | Public read | Profile photos at `<userId>/...`; only the owner can write |

Since `017` both attachment buckets are limited to `application/octet-stream` (the files are ciphertext). Since `021` the `encrypted_attachments` bucket takes files up to 100 MB (the Supabase plan limit wins: 50 MB on the free plan) and **has no client upload policy**: files can only be stored through the signed addresses the server issues after checking size, rate and quota. `avatars` is limited to 2 MB of JPEG, PNG, WebP or GIF. The function `uploaded_bytes_last_day(uuid)` (server only) totals what one account stored in the last 24 hours, reading the uploader from the file name.

## Realtime

Migration `008` puts `messages`, `message_reactions`, `message_receipts`, `conversation_members` and `presence` in the `supabase_realtime` publication (if it exists) and sets `REPLICA IDENTITY FULL` on `messages` and `message_reactions`. Subscribers only receive rows their row level security allows. The app listens to `messages` (insert, update), reactions, receipts, `conversation_members` and community tables.

**Broadcast channels** (typing indicators and call signalling) are not tables. Since `017` they are opened as **private** channels and policies on `realtime.messages` decide who can join: `pc-typing:<conversationId>` for members of that conversation, and `pc-call:<userId>` for the user themselves, with senders limited to people who share a conversation with them. This needs **Realtime Authorization** enabled on the Supabase project; until `017` is applied, private channels are refused. The global `pc-presence` channel is still open to any signed-in user (a known gap).

## Added by migrations 011 to 016

- **Profiles.** Other members can read every profile column except `email` and `phone_number`. Those two are readable only through `get_my_contact()` (your own). The exact-match lookup `find_profiles_by_contact()` from `011` is no longer callable by clients after `016`. **Any new `profiles` column that other people should see must be added to the `GRANT SELECT (...)` list in `011`.**
- **Unread and saved.** `last_read_at` per member drives unread counts. `saved_messages` stores only message ids; the text stays encrypted.
- **Roles.** `owner > admin > member` per group. Only the owner can change roles (a trigger enforces it even for direct API calls). Adding members needs a group admin. "Only admins can post" is enforced in the messages insert rule.
- **Threads.** `messages.thread_root_id` links a reply to its parent. The server can see which message a reply belongs to, not what it says.
- **Communities.** A channel is a `conversations` row with `type = 'channel'` and a `community_id`. Public channels contain every community member; private channels only the chosen people. Writes go through `SECURITY DEFINER` functions that check permissions and use a session flag to pass the role guard.
- **Disappearing messages.** A trigger stamps `expires_at` from the conversation timer on insert. `purge_expired_messages()` deletes expired rows and is scheduled with `pg_cron` if that extension is enabled; the app also calls it while it is open. Encrypted attachment files in Storage are not removed.
- **Blocking and reports.** `blocks` is owner-only. A blocked user cannot insert messages into a direct chat with the person who blocked them. `reports` can be created by any member and read only by platform admins.

## Changing the schema

1. Add a new numbered migration; never edit an applied one.
2. Make it safe to re-run (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS` before `CREATE POLICY`).
3. Update `types/database.ts` and the tests in `tests/security/`.
4. Update this page and [Setup](SETUP.md).

## Added by migrations 017 and 018

- **Blocking works.** The old rule looked up `blocks`, but blocks are readable only by the blocker, so for the person being blocked the lookup always found nothing and their messages were accepted. `is_blocked_in_conversation()` is `SECURITY DEFINER` so it can see the row. This is a general Postgres lesson: **a policy that queries a table is itself filtered by that table's RLS**.
- **Creator can no longer re-add themselves.** Being the creator only lets you seed a brand-new, empty conversation; after that only a group admin can add members.
- **Message columns are frozen.** A trigger compares the old and new row and refuses any change outside the content columns, so a sender cannot move a message to another conversation or back-date it. The same idea protects receipts.
- **Group key envelopes need an admin** (see [E2EE](E2EE.md#group-messages)).
- **Invites are bounded**: at most 720 hours and 250 uses.
- **Avatar URLs** must point at the project's own Supabase avatars bucket or Google's image host, so a profile photo cannot be used to make every viewer's browser fetch a tracking URL.
- **Device cap and write limits** (`018`) are database triggers, so they apply even to someone who calls Supabase directly and skips the API. They do not apply when there is no signed-in user (the SQL editor, the service role).

## Added by migration 019 (admin logs)

Admins do not have Supabase or Vercel access, so the app keeps its own record of problems and admin actions.

- **`error_logs`**: written only by `log_error()`, which is executable by `service_role` (the server) and revoked from everyone else. It upserts by a fingerprint (a hash of source, area and a normalised message with ids and numbers removed), so the same problem is one row whose `occurrences` counter rises; a resolved error that happens again is reopened. Every call also deletes rows not seen for 30 days and trims the table to 5,000 rows, oldest first.
- **`admin_audit_log`**: written by `log_admin_action()` (server only, used by the admin role route) and by the two admin functions below. There are no update or delete grants, so it is append-only.
- **`admin_set_error_status(id, status)`** and **`admin_clear_errors(only_resolved)`**: callable by signed-in users but each starts with `is_admin()` and raises `forbidden` otherwise; each writes an audit row naming the admin.
- Table privileges are also revoked from `anon` and (for writes) `authenticated`, so a future policy mistake could not open the tables.
- **What is stored, and what never is:** error text, the area of the app, the first lines of a stack, the page path (no query string), a short browser string, the release, and the affected user id. Never message content, keys, tokens, passwords, email addresses or request bodies; the text is scrubbed before it reaches the database (`lib/logging/scrub.ts`).
