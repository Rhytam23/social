# PRIVATE-CHAT V1 STATUS

> **This is a snapshot of the V1 audit and rebuild, written at the end of that work.** It is kept as the historical record of what was found and fixed. It is not the current status. For what exists now see the [README](../README.md), [Roadmap](ROADMAP.md) and [Changelog](CHANGELOG.md).
>
> **Changed since this report:**
> - Registration is **no longer invite-only** (migration `007`, replaced by `009`). Everything below about invite-gated signup describes the state at the time.
> - Sign-in now also offers **Google**, and email signup requires confirmation.
> - Migrations `007`, `008` and `009` exist, and there are now 64 automated tests (this report says 68; the invite tests were removed with the invite feature).
> - Google sign-in was confirmed working against a real Supabase project by the project owner. **Everything else listed as unverified in section 4 is still unverified** by automated means; use the [manual checklist](TESTING.md#manual-checklist).
> - The old numbered documentation files this report mentions were replaced; see [docs/README](README.md).
> - A later security review (September 2026) found and fixed further vulnerabilities in the database rules, API routes and headers: see [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md). Statements below that the security posture was sound reflect what was known at the time.

This replaces the previous version of this file, which claimed every area was
"WORKING" across the board. That was false. This document is the result of a
from-scratch audit (7 parallel independent reviews covering auth, messaging,
crypto, attachments/voice, groups/people, database/RLS, and UI/UX) followed by
a large implementation pass. It reports what was actually found broken, what
was actually fixed, what was actually tested, and - just as important - what
was **not** verified and should not be trusted until it is.

**Environment constraint that shapes this whole report**: this sandbox has no
Docker and no live Supabase project, and creating one was outside what I'm
allowed to do unilaterally. Everything below that would require a real
Postgres/Auth/Realtime/Storage backend (the full signup → chat → E2EE → logout
→ login-again user journey, RLS enforcement against real requests, the new
`006_production_hardening.sql` migration, User A ↔ User B ↔ unauthorized
User C testing) is implemented and code-reviewed, but **not executed against a
real backend**, and is called out explicitly as unverified rather than
claimed as passing.

---

## 1. What was broken (audit findings, verified against source, not docs)

- **Fake encryption**: the actual message-send path used `window.btoa(content)` - base64, not encryption - despite UI/landing/privacy-policy copy claiming "Signal Double Ratchet". A real, tested Signal-protocol-shaped crypto module existed in `crypto/` but was never called from the app.
- **The crypto module's chosen library was unusable in a browser**: `@signalapp/libsignal-client` ships only native `.node` binaries (per-OS, loaded via `node-gyp-build`). It cannot run in a web page - only in a Node.js process or Electron. This is a hard technical fact, not a preference, and it explains why the "real" crypto code was never wired in: doing so was never possible with that library in this architecture.
- **Invite-only registration was theater**: `/signup` called `supabase.auth.signUp()` directly, no token required. The separate "redeem invite token" flow was a `setTimeout`-based fake that never called Supabase. A real, well-built invite-validation/consumption backend existed and was never invoked by any UI.
- **Silent fail-open in production**: if `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` were missing or placeholder, `middleware.ts` and the app both silently granted full unauthenticated access rather than failing - a real deploy-time security hole.
- **Email verification / password reset had nowhere to land**: `verify-email` was `return null`; there was no `/auth/callback` or `/auth/confirm` route, so Supabase's real confirmation and recovery links 404'd or landed on a blank page.
- **PII leak**: `/api/users` search returned every matched user's email and phone number to any authenticated caller.
- **Messages never loaded from the database**: the UI only listened for live realtime INSERTs. On refresh or a new device, history was gone even though it was sitting in Postgres, because the working `GET /api/messages` route was never called from any component.
- **Fake-delivered-on-failure**: `sendMessage` marked messages `'delivered'` unconditionally, regardless of whether the server write actually succeeded - explicitly forbidden by this project's own spec.
- **Key backup UI did nothing**: `handleExportKeyBackup`/`handleRestoreKeyBackup` were `setTimeout(resolve, 300)` no-ops, while the UI reported "Encrypted key backup generated using Argon2id + AES-256-GCM" - a fabricated success message.
- **Attachments/voice were fake end-to-end**: a real AES-256-GCM encryptor and a real, IDOR-checked upload API route both existed but neither was ever called. Voice recording used the real `MediaRecorder` API but discarded the recording. Playback was a `setInterval` animation over a hardcoded waveform, no `<audio>` element at all. Download was wired to `undefined`.
- **Groups had no member management UI**, and the "Groups" tab in the sidebar showed the same list as "Chats" with no type filtering - selecting the tab rendered whatever conversation happened to be active, including direct chats, as if it were a group.
- **Hardcoded fake security data**: every user's device list was the same two hardcoded rows, and the identity fingerprint shown in Settings was a single hardcoded string identical for every account.
- **Dead/`return null` routes**: most of `/settings/*`, `/groups/*`, `/admin/*` were blank pages while the real functionality lived only in the SPA at `/`.
- **`alert()` used as UX** for microphone errors; misleading "Signal Double Ratchet" / "Signal Sender Key Protocol" copy throughout the landing page, onboarding modal, chat header, group view, and settings, none of which matched what the code actually did.
- **Client-driven direct-Supabase writes bypassed the app's own IDOR/rate-limit API layer** for message send and conversation/group creation, making that layer dead code for real traffic.

Full findings (with file:line citations) are in the audit transcripts from this session; the above is the summary that drove the fix list.

---

## 2. What was fixed

### Security / correctness (must-fix, done)
- **Invite-only registration now enforced in Postgres itself** (`database/migrations/006_production_hardening.sql`; *later replaced by open registration, migrations `007` and `009`*): the `on_auth_user_created` trigger requires a valid, unused, non-expired invite token matching the registering email, hashed and looked up with `FOR UPDATE` locking, and raises an exception (rolling back the entire `auth.users` insert) if it doesn't match. This holds regardless of what any client does - a request that bypasses the UI entirely and calls the anon-key API directly still can't create an unauthorized account. The very first account on a fresh database is bootstrapped as admin without needing an invite (nothing exists yet to issue one).
- **Fail-closed middleware**: local demo mode is now only reachable when `NODE_ENV !== 'production'`. A production deployment with missing/placeholder Supabase env vars now returns HTTP 500 instead of silently granting access (`middleware.ts`, `lib/supabase/env.ts`).
- **PII leak closed**: `/api/users` no longer selects `email`/`phone_number` into its response (still searchable, never returned).
- **Real `/auth/confirm` route** added implementing the standard Supabase+Next.js SSR `verifyOtp` pattern for both email confirmation and password recovery; `signUp`/`resetPasswordForEmail` now point at it.
- **Private conversations capped at 2 members** via a new Postgres trigger, closing the "any member can silently add a third party to a 1:1 DM" gap.
- **Admin role changes** now go through a new `PATCH /api/admin/users` route using the service-role client, gated by a real server-side admin check (RLS can't do this safely since `is_admin` toggles need a privileged path, not a self-row update).

### Real end-to-end encryption (rebuilt, not patched)
Since libsignal-client cannot run in a browser, the crypto layer (`crypto/`) was rewritten on **libsodium-wrappers** (WASM, runs identically in the browser and under vitest):
- **Identity**: X25519 keypair generated client-side, private key persisted in IndexedDB (`crypto/storage/keyStorage.ts`) so a refresh doesn't lose it. Public key published to `user_devices`.
- **1:1 messages**: `crypto_box` (X25519 + XSalsa20-Poly1305) authenticated encryption. Verified both directions decrypt correctly, including the sender re-reading their own sent message (a real bug I caught and fixed mid-implementation - crypto_box's shared secret is symmetric, so the sender must decrypt with their own key + the *recipient's* public key, not their own; the first draft got this backwards and would have silently decrypted to garbage for a user's own outgoing messages).
- **Groups**: per-group symmetric key (`crypto_secretbox`), distributed to each member device via anonymous sealed boxes (`crypto_box_seal`) so any current member can (re-)distribute it without tracking who sent it. Rotated on every membership change (add or remove) so members who join later cannot decrypt history from before they joined, and removed members stop receiving new keys.
- **Attachments**: existing WebCrypto AES-256-GCM encryptor kept (it was already browser-safe), rewired into the real upload/download path.
- **Key backup**: existing Argon2id (hash-wasm) + AES-GCM export/import kept, rewired to the new key store shape and to a real "Export Backup" button that triggers an actual file download.
- **`@signalapp/libsignal-client` removed from `package.json`** - it was never functional and is actively misleading to keep as a listed dependency.
- Message/attachment encryption content model: everything about a message (text, or an attachment's filename/mimeType/storage path/decryption key) lives **inside** the encrypted envelope. No new plaintext columns were added to `messages` - this was a hard constraint from the project's own rules (now in [Security](SECURITY.md#rules-for-contributors)) and it's respected.

### Real messaging data layer (`lib/store/chatStore.ts`, `lib/messaging/*`)
- Conversation list and message history are now fetched from Supabase on load and on conversation switch (`GET /api/messages`, real conversation/member joins), not just realtime pushes.
- Sending a message: optimistic `'sending'` status → real encrypt → real `POST /api/messages` (server-verified sender identity, membership check, rate limit) → on success, reconciled to the real row id and `'sent'`; on failure, `'failed'` with a working retry button wired to the previously-dead `onRetryFailedMessage` prop.
- Edit/delete now persist via a new `PATCH /api/messages` route (re-encrypts and updates, or soft-deletes). Reactions persist via direct RLS-protected `message_reactions` inserts/deletes.
- Realtime subscription is now scoped to the caller's known conversation IDs as defense-in-depth (RLS remains the authoritative backstop either way), and re-subscribes when the conversation list changes.
- **Local demo mode was kept** (it's useful for previewing the UI without a Supabase project) but is now unmistakably separated: gated to non-production builds only, all seed data/copy relabeled "demo data, not encrypted" instead of claiming real security properties.
- **Critical reactivity bug found and fixed**: every state-mutating method in the store wrote to `this.state.someField = ...` without reassigning the top-level `this.state` object. Since `useSyncExternalStore` only re-renders when the snapshot reference changes, this meant state updates were correctly computed and persisted (visible in `localStorage` and on the next full reload) but **the UI silently never re-rendered them** - a sent message would save but not appear until a manual refresh. This bug appears to predate this session's changes (the original code had the same pattern). Fixed by having `notify()` clone the top-level state object exactly once per notification.

### Attachments & voice (real, tested manually in-browser via demo mode's send path; encryption logic covered by the crypto test suite)
- `lib/messaging/attachments.ts`: encrypts a file client-side, uploads ciphertext via the existing `/api/uploads` route, returns an envelope; download does the reverse via `supabase.storage.download()` (RLS-protected) + client-side decrypt.
- Voice recording now carries its real duration through to the sent message instead of a hardcoded `'0:03'`.
- `VoiceMessagePreview` rewritten to use a real `<audio>` element with real `timeupdate`-driven progress, replacing the `setInterval` fake.
- Attachment download/decrypt is wired to the previously-dead `onDownloadAttachment` prop, with loading/error states shown per-attachment.

### Groups
- Real add/remove-member UI in `GroupSpaceView`, wired to a new `/api/groups/members` route (rate-limited, membership-checked) plus client-side group-key rotation and re-distribution on every membership change.
- Fixed the Groups-tab navigation bug: the sidebar now filters to actual group conversations when that tab is active, and the group workspace no longer renders a direct conversation as if it were a group.

### UI/UX and copy accuracy
- Removed every "Signal Double Ratchet" / "Signal Sender Key Protocol" / "Signal E2EE" claim from the landing page, onboarding modal, chat header, group view, settings, and message-info modal, and replaced with accurate descriptions of what's actually running (X25519/XSalsa20-Poly1305, per-group key distribution, AES-256-GCM, Argon2id).
- Real avatar upload (Settings → Profile), backed by a new public `avatars` storage bucket with owner-write RLS.
- Removed the fake "System" theme option and inert "chat density" toggle (neither did anything); replaced with an honest note that only one theme exists.
- Deleted the orphaned duplicate `SecuritySettings.tsx` component and the fake `InviteFlow.tsx` theater component.
- Fixed all `return null` stub routes (`/settings/profile`, `/settings/security`, `/settings/encryption`, `/groups/create`, `/groups/[id]/settings`, `/admin/users`, `/admin/groups`, `/admin/invites`) to redirect to the real working SPA, consistent with the routes that already did this correctly.
- Replaced `alert()` calls in the message composer with inline error banners.
- Fixed a real mobile-layout bug found during testing: a flexbox `min-width: auto` default was letting long quoted-reply text force message bubbles wider than the viewport on narrow screens, pushing right-aligned bubbles off the left edge. Added `min-w-0` to the relevant containers.
- Onboarding's profile-save error was silently swallowed (caught, then advanced to the next step regardless); now surfaces the real error.

---

## 3. What I actually tested

- **`npx tsc --noEmit`**: clean, zero errors, after every change described above.
- **`npm run lint`**: zero warnings/errors.
- **`npm test` (vitest)**: **68/68 tests passing** across 6 files (crypto/E2EE round-trips including tamper/wrong-key/wrong-recipient rejection and the sender-decrypts-own-message case, security/adversarial suite, invite-token security, authorization, API-route auth gating, chat store). The crypto and adversarial suites were substantially rewritten to match the new libsodium API - not just left passing by accident.
- **`npm run build`**: succeeds, all 34 routes generate. First Load JS for the main app grew from ~103 kB to ~379 kB, mostly the libsodium WASM payload - worth knowing before deploying to a bandwidth-constrained audience.
- **Manual in-browser testing** (via the built-in browser pane, running the app locally in local demo mode - `npm run dev`, no live Supabase project involved): sending and receiving a message with live UI update, emoji reaction, editing, the Chats/Groups/People/Settings/Admin tabs, group member counts, the Settings profile/backup/device panels, the admin invite-generation form, and the mobile (375px) layout. This is where the reactivity bug and the Groups-tab/mobile-overflow bugs above were actually caught - none of them showed up in tsc, lint, or the unit tests.

## 4. What remains blocked or unverified

**Everything requiring a live Supabase project is unverified.** I do not have Docker or a Supabase project in this sandbox, and I'm not able to create one unilaterally. Specifically unverified:
- Running `database/migrations/006_production_hardening.sql` against real Postgres (the invite-enforcement trigger, the pgcrypto `digest()` call, the private-conversation-cap trigger, the new `avatars` bucket policies). It's been carefully reviewed against the existing migrations' conventions, but never executed.
- The full real user journey: signup with a real invite token → email confirmation → login → find a real second user → start a chat → send/receive with real Supabase Realtime push → refresh → logout → login again.
- Real RLS enforcement against actual authenticated requests (as opposed to reading the policy SQL and reasoning about it).
- A genuine User A ↔ User B round trip of encrypted messages through the real database, and a User C unauthorized-access attempt against real data.
- Attachment/voice upload and download against a real Storage bucket.
- Whether GoTrue's actual error response, when the invite trigger raises an exception, is something `LoginForm`'s pre-check-then-friendly-fallback-message logic handles as gracefully as intended.

**Known real gaps, not hidden, not faked - just not done:**
- **Message reactions don't reload from the database.** Writes to `message_reactions` are real, but `GET /api/messages` doesn't join or return them, so a reaction is visible for the rest of that session but disappears on reload/refetch. This needs a join added to the messages route (or a separate fetch) plus a realtime subscription on `message_reactions` for live cross-user updates - neither exists yet.
- **New group members can end up without a working key** if they haven't logged in yet (no device keys published) when the group key is distributed - they're skipped and won't have access until someone re-shares. There's no UI signal today when this happens.
- **"Mark identity verified" in the conversation inspector panel is not wired to any handler** - clicking it does nothing. The safety-number fingerprint itself is now real and computed from the actual peer public key; only the manual verification-confirmation action is unwired.
- **Local demo mode's group add/remove-member buttons are inert** (they call through to methods that no-op without a real Supabase client) - acceptable for a dev-only preview mode, but worth knowing if you poke at it.
- Admin dashboard's per-user "device count" column is still a hardcoded `1`, not a real count from `user_devices`.
- Multi-device support is minimal: a user can have multiple `user_devices` rows, but there's no UI to see messages differently per-device or to explicitly pair a second device via QR/link the way real Signal-derived apps do.

## 5. Final test results

```
tsc --noEmit    PASS  (0 errors)
lint            PASS  (0 warnings/errors)
vitest          PASS  68/68 tests, 6/6 files
build           PASS  (34/34 routes generated)
```

No claim of "production-ready" is made here. The core 1:1 and group messaging pipeline, real invite-gated auth, real E2EE, real attachments/voice, and real group management are implemented and internally consistent, verified by static analysis, unit/integration tests, and manual browser testing in local demo mode. The parts of the required journey that depend on a live Supabase project have not been executed and should be treated as unverified until someone runs them against a real database.
