# 04_DATA_MODEL.md — Data Model & Database Specification

This document provides a comprehensive analysis of the database schema, table definitions, constraints, indexes, Row Level Security (RLS) policies, and client-side data structures in **Private Chat**.

---

## 1. Database Table Inventory & Definitions

### 1.1 `public.profiles`
- **Purpose:** User account profile and system-wide admin designation.
- **Columns:**
  - `id` (`UUID`, PK, FK -> `auth.users(id)` ON DELETE CASCADE): User unique ID.
  - `username` (`TEXT`, UNIQUE, NOT NULL): Handle for user identification.
  - `display_name` (`TEXT`, NOT NULL): Public display name.
  - `avatar_url` (`TEXT`, NULLABLE): Avatar image URL.
  - `is_admin` (`BOOLEAN`, NOT NULL, DEFAULT `FALSE`): System administrative role indicator.
  - `created_at` / `updated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`): Timestamp tracking.
- **Constraints:** `username_min_length CHECK (char_length(username) >= 3)`.
- **Triggers:** `trigger_prevent_profile_admin_escalation` (prevents self-escalation of `is_admin`), `set_profiles_updated_at`.

### 1.2 `public.invites`
- **Purpose:** Single-use invitation tokens restricting registration.
- **Columns:**
  - `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`): Invite ID.
  - `token_hash` (`TEXT`, UNIQUE, NOT NULL): SHA-256 hash of raw invitation token.
  - `assigned_email` (`TEXT`, NOT NULL): Email address designated to consume the invite.
  - `created_by` (`UUID`, FK -> `public.profiles(id)` ON DELETE SET NULL): Admin creator.
  - `status` (`TEXT`, NOT NULL, DEFAULT `'pending'`): State check (`'pending'`, `'used'`, `'revoked'`, `'expired'`).
  - `expires_at` (`TIMESTAMPTZ`, NOT NULL): Expiration deadline.
  - `used_at` / `used_by` / `revoked_at`: Usage and revocation audit fields.
- **Indexes:** `idx_invites_token_hash`, `idx_invites_assigned_email`.

### 1.3 `public.conversations`
- **Purpose:** Chat session metadata container for 1-to-1 and group chats.
- **Columns:**
  - `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`): Conversation ID.
  - `type` (`TEXT`, NOT NULL, CHECK `type IN ('private', 'group')`): Conversation type.
  - `name` (`TEXT`, NULLABLE): Mandatory group title.
  - `avatar_url` (`TEXT`, NULLABLE): Group image avatar.
  - `created_by` (`UUID`, FK -> `public.profiles(id)` ON DELETE SET NULL): Creator profile ID.
  - `created_at` / `updated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`).

### 1.4 `public.conversation_members`
- **Purpose:** Association table tracking membership in conversations.
- **Columns:**
  - `conversation_id` (`UUID`, FK -> `public.conversations(id)` ON DELETE CASCADE).
  - `user_id` (`UUID`, FK -> `public.profiles(id)` ON DELETE CASCADE).
  - `joined_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`).
  - `left_at` (`TIMESTAMPTZ`, NULLABLE): Nullable timestamp set when a member leaves.
- **Primary Key:** `(conversation_id, user_id)`.
- **Note:** Group roles were removed in migration `003_security_foundation.sql`. All members are equal.

### 1.5 `public.messages`
- **Purpose:** Encrypted message payload repository. **Contains zero plaintext columns.**
- **Columns:**
  - `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`).
  - `conversation_id` (`UUID`, FK -> `public.conversations(id)` ON DELETE CASCADE).
  - `sender_id` (`UUID`, FK -> `public.profiles(id)` ON DELETE CASCADE).
  - `ciphertext` (`TEXT`, NOT NULL): Base64 encoded Signal/SenderKey ciphertext.
  - `nonce` (`TEXT`, NOT NULL): Base64 encoded metadata (message type, sender device).
  - `encryption_version` (`INT`, NOT NULL, DEFAULT 1, CHECK `encryption_version >= 1`).
  - `reply_to_message_id` (`UUID`, FK -> `public.messages(id)` ON DELETE SET NULL).
  - `created_at` / `edited_at` / `deleted_at` (`TIMESTAMPTZ`).
- **Indexes:** `idx_messages_conversation`, `idx_messages_created_at`, `idx_messages_sender`.

### 1.6 `public.user_devices`
- **Purpose:** Public prekey bundles for Signal E2EE handshake. Contains **no private key material**.
- **Columns:**
  - `id` (`UUID`, PK).
  - `user_id` (`UUID`, FK -> `public.profiles(id)` ON DELETE CASCADE).
  - `device_id` (`TEXT`, NOT NULL).
  - `identity_public_key` (`TEXT`, NOT NULL): Base64 encoded public identity key.
  - `signed_prekey` (`TEXT`, NOT NULL): Base64 encoded signed prekey.

### 1.7 `public.group_key_envelopes`
- **Purpose:** Encrypted group key distribution material per device.
- **Columns:**
  - `id` (`UUID`, PK).
  - `conversation_id` (`UUID`, FK -> `public.conversations(id)` ON DELETE CASCADE).
  - `user_id` (`UUID`, FK -> `public.profiles(id)` ON DELETE CASCADE).
  - `device_id` (`TEXT`, NOT NULL).
  - `encrypted_group_key` (`TEXT`, NOT NULL): 1-to-1 Signal encrypted SenderKey distribution message.
  - `key_version` (`INT`, NOT NULL, DEFAULT 1).

---

## 2. Client-Side Data Structures

Client application interfaces defined in [`types/ui.ts`](file:///d:/social/types/ui.ts):
- `DeviceItem`: Tracks client device metadata, registration ID, and active state.
- `UserItem`: Represents user directory records with identity fingerprint and presence state.
- `MessageData`: Client-side UI representation of decrypted or mock messages with reaction attachments.
- `ConversationItem`: Direct and group chat sidebar records with unread count and pin status.
