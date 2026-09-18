# 24_CHANGE_IMPACT.md — Change Impact & Dependency Matrix

This document details ripple effects and affected system components when modifying core modules in **Private Chat**.

---

## Change Impact Breakdown

### 1. Modifying Database Schema (`database/migrations/`)
- **Impact Radius:** High.
- **Affected Subsystems:** [`types/database.ts`](file:///d:/social/types/database.ts), Supabase RLS policies ([`002_rls_policies.sql`](file:///d:/social/database/migrations/002_rls_policies.sql)), static SQL security tests ([`tests/security/authorization.test.ts`](file:///d:/social/tests/security/authorization.test.ts)).
- **Safety Action:** Any table modification MUST be followed by updating `types/database.ts` and updating static security tests.

### 2. Modifying Cryptographic Core (`crypto/`)
- **Impact Radius:** Critical.
- **Affected Subsystems:** E2EE test suite ([`tests/crypto/e2ee.test.ts`](file:///d:/social/tests/crypto/e2ee.test.ts)), [`ChatCanvas.tsx`](file:///d:/social/components/chat/ChatCanvas.tsx), [`MessageComposer.tsx`](file:///d:/social/components/messages/MessageComposer.tsx), [`SecuritySettings.tsx`](file:///d:/social/components/settings/SecuritySettings.tsx).
- **Safety Action:** NEVER alter `encryption_version` format or serialized ciphertext structures without running `npm run test`.

### 3. Modifying Admin Authorization (`lib/auth/roles.ts`, `middleware.ts`)
- **Impact Radius:** High.
- **Affected Subsystems:** Admin routes (`app/admin/*`), [`AdminDashboard.tsx`](file:///d:/social/components/admin/AdminDashboard.tsx), invite generation.
- **Safety Action:** Verify that non-admin users cannot access `/admin` or execute `generateInvite()`.
