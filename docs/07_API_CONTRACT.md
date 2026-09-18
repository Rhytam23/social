# 07_API_CONTRACT.md — API Contract & Endpoints Specification

This document specifies the Next.js Server API endpoints, Supabase RPC database functions, request/response formats, authorization requirements, and current implementation status.

---

## 1. Next.js Route Handlers ([`app/api/`](file:///d:/social/app/api))

| Path | Method | Auth Required | Purpose | Status | Notes |
|---|---|---|---|---|---|
| `/api/auth` | `GET` | None | Auth status route placeholder | **PLACEHOLDER** | Returns `{}` |
| `/api/conversations` | `GET` | Authenticated | List conversations | **PLACEHOLDER** | Returns `{}` |
| `/api/groups` | `GET` | Authenticated | List group metadata | **PLACEHOLDER** | Returns `{}` |
| `/api/invites` | `GET` | Admin | Manage invites | **PLACEHOLDER** | Returns `{}` |
| `/api/messages` | `GET` | Authenticated | Fetch messages | **PLACEHOLDER** | Returns `{}` |
| `/api/uploads` | `GET` | Authenticated | Manage attachment uploads | **PLACEHOLDER** | Returns `{}` |
| `/api/users` | `GET` | Authenticated | User directory lookup | **PLACEHOLDER** | Returns `{}` |

---

## 2. Supabase RPC Stored Functions

### `public.consume_invite`
- **Method:** Database RPC call via `supabase.rpc('consume_invite', {...})`.
- **Purpose:** Atomically validates and marks a single-use invitation token as used.
- **Caller Authorization:** `service_role` EXECUTE only ([`database/functions/atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql#L99)). Denied to `authenticated` users.
- **Parameters:**
  ```json
  {
    "p_token_hash": "string (64-char SHA-256 hex hash)",
    "p_user_id": "UUID (newly registered user auth.uid)",
    "p_assigned_email": "string (email address)"
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true,
    "message": "Invite successfully consumed",
    "invite_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
  ```
- **Error Response (Non-sensitive):**
  ```json
  {
    "success": false,
    "message": "Invalid invite token"
  }
  ```

---

## 3. Server Utility Functions ([`lib/invites/`](file:///d:/social/lib/invites))

- `generateInvite({ assignedEmail, createdBy, expiresInDays })`: Creates a 32-byte hex token, hashes it with SHA-256, and inserts a row into `public.invites`.
- `validateInvite(rawToken, userEmail)`: Hashes input token and checks against `public.invites` for matching status and assigned email.
- `consumeInvite({ rawToken, userId, userEmail })`: Calls `consume_invite` RPC via `createAdminClient()`.
