# PRIVATE-CHAT — PRODUCTION DEPLOYMENT CHECKLIST

Use this checklist before and after deploying PRIVATE-CHAT to production with live Supabase.

---

## 1. Supabase Infrastructure
- [ ] **Supabase Project Created**: Project initialized on Supabase Cloud.
- [ ] **Migrations Applied**: `001_initial_schema.sql`, `002_rls_policies.sql`, `003_security_foundation.sql`, and `004_storage.sql` applied cleanly in order.
- [ ] **Row Level Security (RLS) Verified**: RLS enabled on all 10 public tables (`profiles`, `invites`, `conversations`, `conversation_members`, `messages`, `message_reactions`, `message_receipts`, `user_devices`, `group_key_envelopes`, `presence`).
- [ ] **Storage Configured**: `encrypted_attachments` bucket created with `public = false` (Private bucket) and max file size set to 25MB.
- [ ] **Realtime Enabled**: Postgres change feeds enabled for `messages`, `message_reactions`, `message_receipts`, `conversation_members`, and `presence`.
- [ ] **Auth Configured**: Email auth provider enabled, site URL and allowed redirect URLs set.

---

## 2. Secrets & Environment Configuration
- [ ] **`NEXT_PUBLIC_SUPABASE_URL`**: Set to live project URL (`https://<project-ref>.supabase.co`).
- [ ] **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Set to public anon key.
- [ ] **`SUPABASE_SERVICE_ROLE_KEY`**: Set in server environment ONLY.
- [ ] **Service-Role Key Security**: Verified that `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_` and NOT imported in client components.
- [ ] **Rate Limiting Configured**: Upstash Redis variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) configured for multi-instance deployments, or local token-bucket fallback active.

---

## 3. Code & Build Verification
- [ ] **Unit & Security Tests Pass**: `npm test` runs 66/66 tests across 6 test suites with 0 failures.
- [ ] **TypeScript Typecheck**: `npx tsc --noEmit` exits with code 0 and 0 errors.
- [ ] **ESLint**: `npm run lint` exits with 0 warnings and 0 errors.
- [ ] **Production Build**: `npm run build` compiles all 28 static and dynamic routes.
- [ ] **Secrets Scanned**: No hardcoded API keys or private keys exist in the repository.
- [ ] **`.gitignore` Verified**: `.env`, `.env.local`, `.env.*.local`, `.next`, `build/`, `node_modules/` are ignored.

---

## 4. Real-World Live Verification (Post-Deploy Smoke Test)
- [ ] **User A Registration**: User A registers, receives session cookie, and sets profile.
- [ ] **User B Registration**: User B registers in an independent browser session.
- [ ] **Direct Message Flow**: User A initiates chat with User B, sends encrypted message; User B receives message via Supabase Realtime.
- [ ] **Two-Way Reply & Reactions**: User B reacts to message and replies with quote; User A sees updates in real time.
- [ ] **E2EE Ciphertext Check**: Server database `messages` table contains only base64 ciphertext and nonce; zero plaintext in storage.
- [ ] **Encrypted Attachment**: User A sends attachment (image/PDF); binary uploaded to private `encrypted_attachments` bucket; User B successfully downloads and decrypts.
- [ ] **Unauthorized User C Isolation**: User C cannot view, query, or subscribe to User A & User B's conversation or attachments.
- [ ] **Group Messaging**: Group created with A + B; messages broadcast to group participants via Sender Keys.
- [ ] **Mobile & Desktop Ergonomics**: Responsive 2-pane UI verified on mobile (390px) and desktop (1440px).
