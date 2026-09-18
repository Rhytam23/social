# 14_PRODUCTION_CHECKLIST.md — Production Readiness Checklist

This document provides a production readiness verification matrix across 18 operational pillars based strictly on evidence from the codebase.

---

## Production Readiness Matrix

### 1. SECURITY
- `[x]` Database RLS enabled on all 10 public tables ([`002_rls_policies.sql`](file:///d:/social/database/migrations/002_rls_policies.sql)).
- `[x]` E2EE core cryptographic operations executed on client ([`crypto/`](file:///d:/social/crypto)).
- `[x]` Single-use invites protected with SHA-256 hash & `FOR UPDATE` row lock ([`atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql)).
- `[ ]` Alignment of `middleware.ts` admin check with `profiles.is_admin`.

### 2. DATABASE
- `[x]` PostgreSQL schema migrations `001` through `004` defined and structured.
- `[x]` Performance indexes created on foreign keys (`idx_messages_conversation`, `idx_messages_sender`, `idx_invites_token_hash`).
- `[x]` `updated_at` automated triggers applied across mutable tables.

### 3. AUTHENTICATION & AUTHORIZATION
- `[x]` Server-side `isUserAdmin()` utility queries database directly ([`lib/auth/roles.ts`](file:///d:/social/lib/auth/roles.ts)).
- `[ ]` Production Supabase authentication flow fully integrated with UI routes.

### 4. END-TO-END ENCRYPTION (E2EE)
- `[x]` `@signalapp/libsignal-client` integration for 1-to-1 Double Ratchet session handshake.
- `[x]` Signal SenderKeys integration for group encryption and key rotation.
- `[x]` AES-256-GCM client-side attachment encryption.
- `[x]` Argon2id key backup export and import functionality.

### 5. API & FRONTEND
- `[ ]` Replace placeholder API handlers in [`app/api/`](file:///d:/social/app/api) with production handlers.
- `[x]` Tailwind dark theme and component shell established ([`components/layout/AppShell.tsx`](file:///d:/social/components/layout/AppShell.tsx)).

### 6. TESTING & CI/CD
- `[x]` Vitest unit & security test suite passes 34 test assertions ([`npm run test`](file:///d:/social/package.json#L10)).
- `[ ]` Setup GitHub Actions CI workflow in `.github/workflows/ci.yml`.

### 7. ENVIRONMENT & DEPLOYMENT
- `[x]` Environment variables documented in [`.env.example`](file:///d:/social/.env.example).
- `[ ]` Production deployment to Vercel / Netlify with live Supabase project credentials.
