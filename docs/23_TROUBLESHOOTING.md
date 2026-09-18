# 23_TROUBLESHOOTING.md — Troubleshooting & Diagnostic Guide

This document covers solutions for common development, build, database, and cryptographic issues in **Private Chat**.

---

## Common Problems & Remediation Workflows

### 1. WebAssembly / `@signalapp/libsignal-client` Initialization Error
- **Symptom:** `Error: WASM module not initialized` or build failures during Signal key generation.
- **Cause:** Next.js Server Components attempting to run WASM modules without `asyncWebAssembly` or client directive.
- **Remediation:** Ensure all components consuming `crypto/` have `'use client';` specified at the top of the file.

### 2. Supabase Connection & Placeholder Bypass
- **Symptom:** Authentication redirects failing in local development.
- **Cause:** `NEXT_PUBLIC_SUPABASE_URL` contains `placeholder-project.supabase.co`.
- **Remediation:** In local prototype mode, [`middleware.ts`](file:///d:/social/middleware.ts#L13) automatically bypasses redirects when placeholder URLs are detected. Populate real Supabase credentials in `.env.local` to enable full auth redirect testing.

### 3. Invite Consumption `Unauthorized` Error
- **Symptom:** RPC call to `consume_invite` fails with `Unauthorized`.
- **Cause:** Attempting to call `consume_invite` RPC with an authenticated client instead of the service role.
- **Remediation:** Invoke `consumeInvite()` using `createAdminClient()` ([`lib/invites/consumeInvite.ts`](file:///d:/social/lib/invites/consumeInvite.ts#L33)).

### 4. Build or Type Errors During `npx tsc --noEmit`
- **Symptom:** Type errors relating to `Buffer` or Web Crypto globals.
- **Remediation:** Verify `@types/node` is installed (`^20.0.0`) and `tsconfig.json` includes `"dom"` and `"esnext"` libraries.
