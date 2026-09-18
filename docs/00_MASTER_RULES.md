# 00_MASTER_RULES.md — Master Governance & Architectural Rules

This document defines the mandatory rules and constraints that **every developer and AI coding agent** must follow when reading, modifying, extending, or refactoring the **Private Chat** codebase.

---

## 1. Project Purpose & Scope

- **Purpose:** Private Chat is a secure, invite-only, end-to-end encrypted (E2EE) messaging application designed for a closed group of up to 50 users.
- **Core Principles:**
  1. Zero Plaintext Server Access: The server (Supabase / PostgreSQL) MUST NEVER receive, store, or log unencrypted message text or private key material.
  2. Cryptographic Isolation: All E2EE operations (key generation, session establishment, message/group/attachment encryption) must remain strictly isolated on the client inside [`crypto/`](file:///d:/social/crypto).
  3. Single-Use Invitation Security: Access to registration is strictly gated by single-use, cryptographically generated invitation tokens.
  4. Role Hierarchy: Groups have NO roles; all group members are equal. Application administrative status is governed exclusively by `public.profiles.is_admin`.

- **Non-Goals:**
  - Public registration without a valid invitation token.
  - Plaintext server-side message indexing or server-side search.
  - Complex nested group roles or channel moderation hierarchies.
  - Web scraping, external crawling, or third-party ad monetization.

---

## 2. Source-of-Truth Rules

1. **Database Schema:** PostgreSQL migration scripts in [`database/migrations/`](file:///d:/social/database/migrations) are the primary source of truth for schema definitions and Row Level Security (RLS) policies.
2. **TypeScript Types:** [`types/database.ts`](file:///d:/social/types/database.ts) must mirror the database schema exactly.
3. **Cryptographic Contracts:** The `@signalapp/libsignal-client` bindings and wrapper modules in [`crypto/`](file:///d:/social/crypto) define the immutable cryptographic protocol.

---

## 3. Architecture Rules

1. **Client/Server Isolation:**
   - Client code must never import `createAdminClient` or reference `SUPABASE_SERVICE_ROLE_KEY`.
   - Server route handlers must validate authenticated user context before executing operations.
2. **E2EE Boundary:**
   - Unencrypted data must never be transmitted over network calls or logged in error trackers.
   - Message payloads sent to Supabase MUST contain only `ciphertext`, `nonce`, and `encryption_version`.

---

## 4. Coding & Security Rules

1. **No Plaintext Logging:** Never log private keys, decrypted message contents, attachment AES keys, or raw invite tokens to `console.log` or external monitoring.
2. **Service Role Restrictions:** `SUPABASE_SERVICE_ROLE_KEY` is restricted exclusively to server-side functions (such as invite generation and consumption).
3. **Admin Check Consistency:** Administrative authorization checks MUST query `public.profiles.is_admin` via server-side database lookup ([`lib/auth/roles.ts`](file:///d:/social/lib/auth/roles.ts)). Never rely on client-malleable JWT `app_metadata`.

---

## 5. Forbidden Shortcuts

- **DO NOT** add a `content` or `plaintext` column to the `public.messages` database table.
- **DO NOT** store private identity keys or session keys in local unencrypted state or cookie storage. Use IndexedDB key storage ([`crypto/storage/keyStorage.ts`](file:///d:/social/crypto/storage/keyStorage.ts)).
- **DO NOT** weaken RLS policies with `USING (true)` or `WITH CHECK (true)` unless strictly intended for public prekey discovery.
- **DO NOT** comment out or delete failing security tests in [`tests/security/`](file:///d:/social/tests/security).

---

## 6. Environment & Dependency Rules

1. **Environment Variables:** All new configuration options must be defined in `.env.example`. Secrets must be marked as server-only.
2. **Dependencies:** Any addition of external NPM packages must be justified for security and bundle impact. No third-party analytics or external tracking scripts may be added.

---

## 7. Mandatory AI Agent Workflow

When modifying this repository, AI coding agents must follow this sequential protocol:
1. **Inspect:** Read relevant codebase files and migration scripts.
2. **Plan:** Document proposed changes and security impacts.
3. **Implement:** Make minimal, precise changes without altering unrequested features.
4. **Test:** Run `npx tsc --noEmit` and `npm run test` to verify zero build or test regressions.
5. **Update Docs:** Update corresponding documentation files in `/docs`.
