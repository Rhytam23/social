# 17_DECISIONS.md — Architecture Decision Records (ADRs)

This document records the major architectural choices, rationale, trade-offs, and current status of decisions made in **Private Chat**.

---

## ADR 001: Selection of `@signalapp/libsignal-client` for E2EE
- **Context:** The application requires cryptographically secure 1-to-1 and group messaging with forward secrecy and break-in recovery.
- **Decision:** Use official Signal protocol bindings (`@signalapp/libsignal-client`).
- **Reason:** Provides industry-standard Double Ratchet, PreKey bundle handshakes, and Signal SenderKeys for efficient group encryption.
- **Trade-offs:** WASM bundle size overhead and synchronous execution on client main thread.
- **Status:** **APPROVED & IMPLEMENTED** ([`crypto/`](file:///d:/social/crypto)).

---

## ADR 002: Removal of Group Roles (Equal Member Model)
- **Context:** Group management complexity introduces authorization bugs and privilege escalation risks.
- **Decision:** Remove `role` column from `public.conversation_members` and drop `is_group_admin()` SQL function in migration `003`.
- **Reason:** Simplifies group governance. Every member of a group has equal permissions to manage group details or leave.
- **Trade-offs:** No hierarchical admin moderation within groups.
- **Status:** **APPROVED & IMPLEMENTED** ([`003_security_foundation.sql`](file:///d:/social/database/migrations/003_security_foundation.sql)).

---

## ADR 003: Single-Use Invitation Registration Requirement
- **Context:** Open registration invites spam and unauthorized user registration.
- **Decision:** Gated registration requiring single-use invitation tokens validated via atomic RPC (`consume_invite`).
- **Reason:** Enforces a closed community limit (max 50 users) with strict email binding and SHA-256 token hashing.
- **Trade-offs:** Adds friction to user onboarding.
- **Status:** **APPROVED & IMPLEMENTED** ([`atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql)).

---

## ADR 004: Argon2id Key Derivation for E2EE Backup
- **Context:** Passphrase-based key backups must resist offline brute-force attacks.
- **Decision:** Use Argon2id via `hash-wasm` with 64MB memory, 4 parallelism, and 3 iterations.
- **Reason:** Argon2id is a memory-hard KDF offering strong resistance against GPU/ASIC cracking.
- **Trade-offs:** Requires ~64MB client memory during backup creation/restoration.
- **Status:** **APPROVED & IMPLEMENTED** ([`crypto/backup/keyBackup.ts`](file:///d:/social/crypto/backup/keyBackup.ts)).
