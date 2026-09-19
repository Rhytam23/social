# API reference

Route handlers live in `app/api/**/route.ts`, plus `app/auth/confirm/route.ts`.

**Conventions**
- Requests are authenticated with the Supabase session cookie. Unless noted, a signed-out call returns `401 { "error": "Authentication required." }`.
- Errors have the shape `{ "error": string }`.
- Every route is rate limited per IP per 60 seconds; going over returns `429`. See [Security](SECURITY.md#known-gaps) for the limiter's caveats.
- Routes use the caller's own session, so row level security applies. The service-role client is used only where marked.
- Message bodies are opaque ciphertext. The server never receives plaintext.

## Session and people

### `GET /api/auth` (120/min)
Returns the current session.
- `200 { authenticated: true, user: { id, email, profile } }`. `profile` is `id, username, display_name, avatar_url, is_admin, created_at` or `null`.
- Signed out: `401 { authenticated: false, user: null }`.

### `GET /api/users?q=` (60/min)
Search people. `q` is optional; `%` and `_` are stripped. Matches `username`, `display_name`, `email` and `phone_number`.
- `200` array of `{ id, username, display_name, avatar_url, created_at }`, at most 100, excluding the caller. **Email and phone are searchable but never returned.**

## Conversations and groups

### `GET /api/conversations` (120/min)
`200` array of `{ id, type, name, avatar_url, created_at, updated_at }` for conversations you are an active member of, newest first.

### `POST /api/conversations` (30/min)
Body: `{ type: "private" | "group", name?, participantIds: string[] }`. `name` is required for groups; `participantIds` must not be empty. You are added automatically.
- `201 { id, type, name, created_at }` · `400` invalid input.

### `GET /api/groups?groupId=` (60/min)
Group details for an active member.
- `200 { id, type, name, avatar_url, created_at, updated_at, members: [{ user_id, joined_at, profiles: { id, username, display_name, avatar_url } }] }`
- `400` missing id · `403` not a member · `404` not found or not a group.

### `POST /api/groups` (20/min)
Body: `{ name, memberIds: string[] }`. You are added automatically. `201 { id, type, name, created_at }`.

### `POST /api/groups/members` (30/min)
Add a member. Body: `{ groupId, userId }`. Caller must be an active member of the group.
`201 { success: true }` · `403` not a member · `404` group not found.

### `DELETE /api/groups/members?groupId=&userId=` (30/min)
Remove a member (a hard delete of the membership row). The route has no membership check of its own: row level security limits it to removing yourself (leaving), or anyone if you are a platform admin. The client then rotates the group key. `200 { success: true }`.

### `PATCH /api/groups` (30/min)
Body `{ groupId, name?, description?, onlyAdminsPost? }`. Group admins only. Names are 1 to 80 characters, descriptions up to 500.

### `PATCH /api/groups/members` (30/min)
Body `{ groupId, userId, role }` where role is `owner`, `admin` or `member`. Owner only; promoting someone to `owner` makes the caller an admin. Needs migration `013`.

`POST /api/groups/members` now requires the caller to be a group admin or owner, and `DELETE` lets you remove yourself, or remove someone ranked below you. When the owner leaves, ownership passes to the longest-serving admin (or member) first.

## Messages

### `GET /api/messages?conversationId=&limit=&before=` (120/min)
History for an active member. `limit` defaults to 100 (1 to 200). `before` is an ISO timestamp; only older messages are returned.
- `200` array, **oldest first**, of `{ id, conversation_id, sender_id, ciphertext, nonce, encryption_version, reply_to_message_id, created_at, edited_at, deleted_at }`.
- Soft-deleted messages are included with `deleted_at` set. To page backwards, pass the oldest `created_at` you have as `before`.
- Reactions are **not** included yet.

### `POST /api/messages` (60/min)
Send. Body: `{ conversationId, ciphertext, nonce, encryptionVersion?, replyToMessageId? }`. Caller must be an active member.
`201 { id, conversation_id, sender_id, ciphertext, nonce, encryption_version, created_at }`.

### `PATCH /api/messages` (60/min)
Edit or delete your own message. Body: `{ messageId, ... }`
- Delete: add `deleted: true` (sets `deleted_at`).
- Edit: send `ciphertext`, `nonce`, `encryptionVersion` (sets `edited_at`); both `ciphertext` and `nonce` are required.
- `200` updated row · `404` not found or not yours.

## Calls

### `GET /api/turn` (30/min)
Returns `{ iceServers, relayAvailable }` for a call. Signed-in users only. TURN credentials, when configured, are short-lived and the response is never cached.

## Database functions called from the browser

Communities, disappearing messages and a few lookups are Postgres functions called with `supabase.rpc(...)`, each checking permissions itself: `create_community`, `create_channel`, `create_community_invite`, `join_community`, `leave_community`, `remove_community_member`, `set_community_role`, `set_disappearing`, `purge_expired_messages`, `get_unread_counts`, `get_my_contact`, `find_profiles_by_contact`. See [Database](DATABASE.md).

## Files

### `POST /api/uploads` (20/min)
`multipart/form-data` with `file` (already encrypted by the browser) and `conversationId`. Active members only. Maximum 25 MB. Stored in `encrypted_attachments` at `<conversationId>/<timestamp>_<safeName>` as `application/octet-stream`.
- `201 { path, fileName, fileSize, uploadedAt }` · `413` too large · `403` not a member.

## Admin

### `PATCH /api/admin/users` (20/min)
Admin only (checked against `profiles.is_admin`). Body: `{ userId, isAdmin: boolean }`. You cannot remove your own admin access. Uses the **service-role** client. `200 { id, username, display_name, is_admin }`.

The old `/api/invites` routes were removed; registration no longer uses invitations.

## Authentication redirects

### `GET /auth/confirm`
Where email confirmation, password reset and Google sign-in links return to. No rate limit.

| Query | Meaning |
|---|---|
| `code` | PKCE code, exchanged for a session |
| `token_hash` and `type` | Alternative email-template style, verified as a one-time code |
| `next` | Where to go afterwards. Must start with `/` and not `//`, otherwise `/` |
| `provider` | Present for Google sign-in; failures are reported as sign-in problems |
| `error`, `error_code`, `error_description` | Passed by Supabase when the link failed |

On success it redirects to `next`. On failure it redirects to `/login?error=<reason>` with an optional `&detail=<text, max 160 chars>`. Reasons: `confirmation_failed`, `oauth_failed`, `oauth_cancelled`, `link_expired`.

## Middleware behaviour

`middleware.ts` runs on every path except static assets. It refreshes the session and:
- redirects signed-out users from `/chat`, `/people`, `/groups` and `/settings` to `/login`;
- for `/admin`, redirects signed-out users to `/login` and non-admins to `/chat` (admin status comes from `profiles.is_admin`);
- redirects signed-in users away from `/login`, `/register`, `/forgot-password` and `/reset-password`;
- returns `500 Server misconfiguration` in production if the Supabase variables are missing (in development it lets the demo mode through).

It does not gate `/api/*`; each route does its own authentication.
