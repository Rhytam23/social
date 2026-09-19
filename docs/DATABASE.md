# Database

The schema is defined only by the SQL files in `database/migrations/`. This page describes the **final state after migrations 001 to 009**. `types/database.ts` mirrors it and must be updated with every schema change.

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
| `functions/atomic_invite_consumption.sql` | `consume_invite` (unused; the invite feature was removed from the app) | Yes. Not numbered; skip on new installs |

## Tables

All tables have row level security enabled.

| Table | Purpose and notable constraints |
|---|---|
| `profiles` | One per user; `id` references `auth.users` (cascade). `username` unique, at least 3 characters. `display_name`, `avatar_url`, `is_admin` (default false), `email` unique, `phone_number` unique |
| `invites` | **Unused.** Left over from the removed invitation feature (token hash, status). The app no longer reads or writes it; it can be dropped in a future migration |
| `conversations` | `type` is `private` or `group`; a group must have a name |
| `conversation_members` | Primary key (`conversation_id`, `user_id`); `joined_at`, `left_at`. No role column |
| `messages` | `ciphertext` and `nonce` required, **no plaintext column**; `encryption_version`; `reply_to_message_id`; `edited_at`, `deleted_at` (soft delete) |
| `message_reactions` | Primary key (`message_id`, `user_id`, `reaction`) |
| `message_receipts` | Primary key (`message_id`, `user_id`); `delivered_at`, `read_at`. Created, not yet used by the app |
| `user_devices` | Public keys only (`identity_public_key`, `signed_prekey`); unique per (`user_id`, `device_id`) |
| `group_key_envelopes` | Group key sealed to one device; unique per (`conversation_id`, `user_id`, `device_id`, `key_version`) |
| `presence` | `online`, `last_seen`. Created, not yet used by the app |

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
- **`prevent_profile_admin_escalation()`**: on `profiles`, a signed-in caller cannot set or change `is_admin`. Direct database and service-role changes (including the first-user bootstrap) are allowed.
- **`enforce_private_conversation_cap()`**: rejects a third active member in a private conversation.
- **`set_updated_at()`**: keeps `updated_at` current on several tables.
- **`consume_invite(...)`**: atomic single-use invite redemption, `service_role` only. **Unused** since the invite feature was removed; can be dropped together with the `invites` table.

## Row level security summary

| Table | Read | Write |
|---|---|---|
| `profiles` | Any signed-in user | Update own row only. No client insert or delete |
| `invites` | Admin | Admin |
| `conversations` | Members, admins | Insert as creator; update by any member or admin; delete by admin |
| `conversation_members` | Members, admins | Insert by the conversation creator or any member; update and delete own row, or admin |
| `messages` | Members | Insert as yourself if a member; update and delete only your own messages |
| `message_reactions` | Members | Insert as yourself if a member; delete your own |
| `message_receipts` | Members | Insert and update your own |
| `user_devices` | Yourself, and people you share a conversation with | Insert, update, delete your own |
| `group_key_envelopes` | Your own rows, if a member | Insert by a member for a valid recipient device |
| `presence` | Yourself, and people you share a conversation with | Insert and update your own |

Two things to be aware of are recorded in [Security](SECURITY.md#known-gaps): profile columns (including email and phone) are readable by any signed-in user, and the insert rule on `conversation_members` lets a conversation's creator add any user id.

## Storage

| Bucket | Visibility | Contents and rules |
|---|---|---|
| `encrypted_attachments` | Private | Encrypted files uploaded by the app at `<conversationId>/<timestamp>_<name>`. Read and write only for members of that conversation (first path segment) |
| `attachments` | Private | Created by `004` with the same rules; the app currently uses `encrypted_attachments` |
| `avatars` | Public read | Profile photos at `<userId>/...`; only the owner can write |

No size or file type limits are set in SQL; the upload route enforces 25 MB.

## Realtime

Migration `008` puts `messages`, `message_reactions`, `message_receipts`, `conversation_members` and `presence` in the `supabase_realtime` publication (if it exists) and sets `REPLICA IDENTITY FULL` on `messages` and `message_reactions`. Subscribers only receive rows their row level security allows. The app currently listens for `INSERT` and `UPDATE` on `messages`.

## Changing the schema

1. Add a new numbered migration; never edit an applied one.
2. Make it safe to re-run (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS` before `CREATE POLICY`).
3. Update `types/database.ts` and the tests in `tests/security/`.
4. Update this page and [Setup](SETUP.md).
