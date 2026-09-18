# 13_TESTING.md — Testing Specification & Coverage Matrix

This document presents an audit of the automated testing suite in **Private Chat**, analyzing Vitest tests, coverage gaps, and recommended test matrices.

---

## 1. Existing Test Suites Audit

The repository uses **Vitest** (`^3.0.7`) configured in `package.json` (`"test": "vitest run"`).

| Test File | Location | Test Count | Tested Features | Key Assertions |
|---|---|---|---|---|
| `e2ee.test.ts` | [`tests/crypto/e2ee.test.ts`](file:///d:/social/tests/crypto/e2ee.test.ts) | 12 Tests | Device key generation, Signal 1-to-1 E2EE, Group SenderKey rotation, AES-GCM attachments, Argon2id key backup | Identity keys, session persistence, ciphertext decryption, key backup import/export |
| `authorization.test.ts` | [`tests/security/authorization.test.ts`](file:///d:/social/tests/security/authorization.test.ts) | 14 Tests | Static SQL migration analysis (`001`, `003`, `004`) | Group roles removal, admin escalation prevention, RLS policy scoping, storage owner isolation |
| `invite.test.ts` | [`tests/security/invite.test.ts`](file:///d:/social/tests/security/invite.test.ts) | 8 Tests | Token generation, SHA-256 hashing, timing-safe compare, `consume_invite` SQL analysis | Token length/entropy, constant-time compare, service_role execution restriction |

---

## 2. Test Coverage Gaps

1. **Next.js Route Handlers:** No integration tests exist for API routes under `app/api/`.
2. **React UI Components:** No component testing setup (React Testing Library / Playwright / Cypress) currently tests UI components.
3. **Supabase Client Hooks:** No end-to-end testing against an active Supabase local emulator (Supabase CLI).

---

## 3. Recommended Test Matrix

- **Unit Tests:** Retain and expand Vitest cryptographic suite (`tests/crypto/*`).
- **Database Security Tests:** Expand static SQL tests (`tests/security/*`) and add live Supabase pgTAP tests.
- **End-to-End Tests:** Add Playwright test suite for login, invite redemption, and message sending.
