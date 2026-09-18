# 15_MICROTASKS.md — Prioritized Implementation Microtasks

This document breaks down the remaining technical tasks into small, actionable implementation microtasks with assigned priorities.

---

## Task Backlog

### P0 — Blocking & Security Critical

#### Task `SEC-01`: Fix Middleware Admin Authorization Check
- **Priority:** `P0`
- **Affected Files:** [`middleware.ts`](file:///d:/social/middleware.ts#L40)
- **Prerequisite:** None.
- **Description:** Replace `user.app_metadata?.is_admin === true` in `middleware.ts` with a direct check against `public.profiles.is_admin` via server-side lookup or custom session claim synchronization.
- **Acceptance Criteria:** `middleware.ts` evaluates admin status identically to `public.is_admin()` SQL function.

---

### P1 — Important Technical Tasks

#### Task `API-01`: Wire Up Next.js API Route Handlers
- **Priority:** `P1`
- **Affected Files:** [`app/api/auth/route.ts`](file:///d:/social/app/api/auth/route.ts), `app/api/conversations/route.ts`, `app/api/messages/route.ts`, etc.
- **Prerequisite:** `SEC-01`.
- **Description:** Replace dummy `{}` GET returns with real Next.js API route handlers fetching and updating Supabase database records.
- **Acceptance Criteria:** Client routes communicate with Next.js route handlers with validated user sessions.

#### Task `PERF-01`: Web Worker Offloading for Crypto Engine
- **Priority:** `P1`
- **Affected Files:** [`crypto/identity/deviceKeys.ts`](file:///d:/social/crypto/identity/deviceKeys.ts), `crypto/backup/keyBackup.ts`
- **Prerequisite:** None.
- **Description:** Move WASM-heavy key generation and Argon2id hash computations into a background Web Worker (`crypto.worker.ts`).
- **Acceptance Criteria:** UI frame rate remains unaffected during key generation and backup derivation.

---

### P2 — Feature & UI Enhancements

#### Task `UI-01`: Google Stitch Redesign Preparation
- **Priority:** `P2`
- **Affected Files:** `components/*`
- **Prerequisite:** Completing docs and UI baseline assessment.
- **Description:** Refactor UI design system and components according to Google Stitch aesthetic design tokens.
- **Acceptance Criteria:** Responsive layout updated with vibrant colors, micro-animations, and glassmorphism.

---

### P3 — Infrastructure & QA

#### Task `CICD-01`: GitHub Actions Setup
- **Priority:** `P3`
- **Affected Files:** `.github/workflows/ci.yml`
- **Prerequisite:** None.
- **Description:** Create workflow file executing `tsc`, `lint`, and `test` on every pull request.
- **Acceptance Criteria:** PR checks execute automated tests.
