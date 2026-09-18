# 10_SECURITY.md — Security Audit & Threat Model

This document presents a comprehensive security audit of the **Private Chat** application covering authentication, authorization, Row Level Security (RLS), E2EE implementation, and vulnerability findings.

---

## 1. Vulnerability Findings & Security Audit

### 1.1 `[HIGH]` Middleware Admin Authorization Discrepancy
- **Severity:** `HIGH`
- **Affected File:** [`middleware.ts`](file:///d:/social/middleware.ts#L40)
- **Description:** `middleware.ts` evaluates admin status via `user.app_metadata?.is_admin === true`. However, SQL migration `003_security_foundation.sql` explicitly states that `is_admin` is derived strictly from `public.profiles.is_admin`.
- **Impact:** If `app_metadata` is not kept in lockstep with `public.profiles.is_admin`, authorization bypasses or lockout inconsistencies could occur.
- **Recommended Fix:** Update `middleware.ts` or server utilities to query `isUserAdmin(user.id)` from [`lib/auth/roles.ts`](file:///d:/social/lib/auth/roles.ts).

### 1.2 `[MEDIUM]` Main-Thread Cryptographic Processing (DOS Risk)
- **Severity:** `MEDIUM`
- **Affected File:** [`crypto/identity/deviceKeys.ts`](file:///d:/social/crypto/identity/deviceKeys.ts), [`crypto/backup/keyBackup.ts`](file:///d:/social/crypto/backup/keyBackup.ts)
- **Description:** Argon2id key derivation (64MB memory, 3 iterations) and libsignal WASM execution run synchronously on the main UI thread.
- **Impact:** Heavy cryptographic computations can freeze the UI thread for 500ms–2000ms.
- **Recommended Fix:** Offload key generation and Argon2id processing to Web Workers.

---

## 2. Security Design Strengths

1. **Zero Plaintext Storage:** The database schema ([`001_initial_schema.sql`](file:///d:/social/database/migrations/001_initial_schema.sql)) contains no `content` column in `public.messages`.
2. **Post-Quantum Preparedness:** Signal device key generation incorporates Kyber KEM prekeys (`KyberPreKeyRecord`).
3. **Atomic Single-Use Invites:** `consume_invite` RPC uses `FOR UPDATE` row locking and SHA-256 token hashing, preventing race conditions or timing attacks.
4. **Strict RLS Scope:** Migration `003` removed group roles and restricted `user_devices` and `presence` visibility to mutual conversation participants (`shares_conversation_with`).
