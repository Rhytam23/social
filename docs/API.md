# API reference

Route handlers live in `app/api/**/route.ts`, plus `app/auth/confirm/route.ts`.

**Conventions**
- Requests are authenticated with the Supabase session cookie. Unless noted, a signed-out call returns `401 { "error": "Authentication required." }`.
- Errors have the shape `{ "error": string }`.
- **Rate limits** are per address *and* per signed-in account per 60 seconds (the numbers below are the per-account limit; the per-address limit is looser). Going over returns `429 { "error": "Rate limit exceeded." }` with a `Retry-After` header. `middleware.ts` also applies a coarse per-address limit to everything before any route runs (300 requests a minute for `/api` and `/auth`, 600 for pages) and rejects `/api` bodies over 2 MB with `413`. The client address comes from the platform's trusted header (`x-vercel-forwarded-for`, `x-real-ip`), never the first, forgeable, `X-Forwarded-For` entry. Without Upstash configured, limits are per server instance. See [Security](SECURITY.md#denial-of-service).
- **Cross-site protection.** Every state-changing request (`POST`, `PATCH`, `DELETE`) must have an `Origin` header matching the host; otherwise `403`. Browsers add it automatically.
- **Ids are validated.** Every id in a query string or body must be a UUID, otherwise `400`. Bodies must be JSON objects within a size cap (4 KB for small routes, 512 KB for messages).
- **Errors are generic.** A database failure returns a short, fixed message (for example `Could not send the message.`); the details are never sent to the client. They are written to the console and to the admin error log (Admin, Errors) so admins can read them without hosting access.
- **Nothing is cached.** All `/api/*` responses carry `Cache-Control: no-store`.
- The shared helpers are in `lib/api/security.ts`. A new route must use them.
- Routes use the caller's own session, so row level security applies. The service-role client is used only where marked.
- Message bodies are opaque ciphertext. The server never receives plaintext.

## People

The app reads the current session and its own conversations straight from Supabase, so there are no session, conversation-list or group-detail routes (`GET /api/auth`, `GET /api/conversations` and `GET /api/groups` were removed as unused).

### `GET /api/users?username=` (60/min per address, 30/min per account)
Find one person by **exact username**. This is the only way to discover someone you have not talked to. The value is trimmed, a leading `@` is dropped and it is lower-cased; it must be 3 to 30 letters, numbers, dots or underscores. Display name, email, phone number and bio are never searched.
- `200 { user: { id, username, display_name, avatar_url, created_at, bio?, pronouns?, timezone?, blocked } }` on a match, `200 { user: null }` when nobody has that username (you never get a partial match).
- `blocked` is `true` when *you* blocked that person. Whether someone blocked *you* is not revealed.
- `400 { error }` for an empty or invalid username (including email addresses and phone numbers). The caller is never returned.

### `GET /api/users` (60/min)
People you already share a conversation with (used to fill the contacts list). Platform admins get the full list for the admin dashboard. The old free-text `q` parameter no longer does anything. `200` array of `{ id, username, display_name, avatar_url, created_at, bio?, pronouns?, timezone? }`.

## Conversations and groups

### `POST /api/conversations` (30/min)
Body: `{ type: "private" | "group", name?, participantIds: string[] }`. `name` is required for groups; `participantIds` must be a list of valid UUIDs, not empty and bounded. You are added automatically.
- `201 { id, type, name, created_at }` · `400` invalid input.

### `POST /api/groups` (20/min)
Body: `{ name, memberIds: string[] }`. You are added automatically. `201 { id, type, name, created_at }`.

### `POST /api/groups/members` (30/min)
Add a member. Body: `{ groupId, userId }`. Caller must be a group **admin or owner** (plain members are refused). Works only on plain groups, not direct chats or community channels. `201 { success: true }` · `403` not allowed · `404` group not found.

### `DELETE /api/groups/members?groupId=&userId=` (30/min)
Remove a member (a hard delete of the membership row). The caller must be an active member; you can remove yourself, or someone ranked below you (owner above admin above member). When the owner leaves, ownership first passes to the longest-serving admin (or member). Row level security checks the same rules again. The client then rotates the group key. `200 { success: true }` · `403` not allowed · `404` not a plain group or that person is not in it.

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
Send. Body: `{ conversationId, ciphertext, nonce, encryptionVersion?, replyToMessageId? }`. Caller must be an active member (and not blocked, and allowed to post if the group is admin-only). `ciphertext` is at most 200,000 characters, `nonce` at most 128, `encryptionVersion` 0 to 10. `sender_id` is always taken from the session, never from the body. A reply target must be in the same conversation. The database also limits an account to 120 messages a minute (`429`-style failure).
`201 { id, conversation_id, sender_id, ciphertext, nonce, encryption_version, created_at }`.

### `PATCH /api/messages` (60/min)
Edit or delete your own message. Body: `{ messageId, ... }`
- Delete: add `deleted: true` (sets `deleted_at`).
- Edit: send `ciphertext`, `nonce`, `encryptionVersion` (sets `edited_at`); both `ciphertext` and `nonce` are required. A deleted message cannot be edited.
- `deleted` must be a real boolean. Only content columns can change; the database refuses anything else.
- `200` updated row · `404` not found or not yours.

## Calls

### `GET /api/turn` (30/min)
Returns `{ iceServers, relayAvailable }` for a call. Signed-in users only. TURN credentials, when configured, are short-lived and the response is never cached.

## Database functions called from the browser

Communities, disappearing messages and a few lookups are Postgres functions called with `supabase.rpc(...)`, each checking permissions itself: `create_community`, `create_channel`, `create_community_invite`, `join_community`, `leave_community`, `remove_community_member`, `set_community_role`, `set_disappearing`, `purge_expired_messages`, `get_unread_counts`, `get_my_contact`. (`find_profiles_by_contact` still exists but clients can no longer call it after `016`.) See [Database](DATABASE.md).

## Error reports from the browser

### `POST /api/logs/client` (20/min per account)
Stores an error that happened in someone's browser in the admin error log. Signed-in users only; cross-site requests are refused; body at most 8 KB. Body: `{ area: string (1-120), message: string (1-2000), detail?: string (<= 4000, top of a stack), level?: "error" | "warn", path?: string (<= 300) }`. The affected user is always the session's user and the source is always `client`; anything the body says about either is ignored. Text is scrubbed of tokens, emails and long secrets before storage. `202 { ok: true }` · `400` malformed · `401` · `403` cross-site · `413` too large · `429`. The browser sends at most 10 reports a minute and each distinct error once a minute (`lib/logging/clientLogger.ts`).

## Files

### `POST /api/uploads` (20/min)
`multipart/form-data` with `file` (already encrypted by the browser) and `conversationId`. Active members only. Maximum 25 MB. Stored in `encrypted_attachments` at `<conversationId>/<random uuid>_<safeName>` as `application/octet-stream`. The file name is reduced to safe characters (no path separators, no leading dot, at most 120 characters).
- `201 { path, fileName, fileSize, uploadedAt }` · `413` too large · `403` not a member.

## Admin

### `PATCH /api/admin/users` (20/min)
Admin only (checked against `profiles.is_admin`). Body: `{ userId, isAdmin: boolean }`. You cannot remove your own admin access. Uses the **service-role** client, and records the change in the admin activity log (`admin_audit_log`) and the server log. `200 { id, username, display_name, is_admin }`.

The old `/api/invites` routes were removed; registration no longer uses invitations.

## Authentication redirects

### `GET /auth/confirm`
Where email confirmation, password reset and Google sign-in links return to. Rate limited to 30 per address per minute.

| Query | Meaning |
|---|---|
| `code` | PKCE code, exchanged for a session |
| `token_hash` and `type` | Alternative email-template style, verified as a one-time code |
| `next` | Where to go afterwards. Must be a same-site path: starts with a single `/`, no `//`, no backslash, no control characters; otherwise `/` |
| `provider` | Present for Google sign-in; failures are reported as sign-in problems |
| `error`, `error_code`, `error_description` | Passed by Supabase when the link failed |

On success it redirects to `next`. On failure it redirects to `/login?error=<reason>` with an optional `&detail=<text, max 160 chars>`. Reasons: `confirmation_failed`, `oauth_failed`, `oauth_cancelled`, `link_expired`.

## Middleware behaviour

`middleware.ts` runs on every path except static assets. First it applies the flood limit and body-size cap described above (before any Supabase call), then it refreshes the session and:
- redirects signed-out users from `/chat`, `/people`, `/groups` and `/settings` to `/login`;
- for `/admin`, redirects signed-out users to `/login` and non-admins to `/chat` (admin status comes from `profiles.is_admin`);
- redirects signed-in users away from `/login`, `/register`, `/forgot-password` and `/reset-password`;
- returns `500 Server misconfiguration` in production if the Supabase variables are missing (in development it lets the demo mode through).

It does not gate `/api/*`; each route does its own authentication.
