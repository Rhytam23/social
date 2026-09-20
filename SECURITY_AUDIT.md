# Security audit

Scope: the code in this repository, read directly. Earlier "production-ready" claims were not trusted. Update 2 (multi-device and flood protection) is included below.

Status words: **PASS** verified by a test I ran. **FIXED** found, fixed, and re-tested. **UNVERIFIED** could not be tested here. **BLOCKED** needs a credential, an account or an external setting.

## 1. Vulnerabilities found

| # | Severity | Finding | Status |
|---|---|---|---|
| V1 | **Critical (secrets)** | The repository is **public** and its git history contains `server/.env.production` (commits `f92d7b5`, `4453243`) with a Neon Postgres connection string including a password (pooled and direct) and a `JWT_SECRET`, from an earlier unrelated project. Still retrievable by anyone. | **Rotation reported done by the owner on 2026-09-20** (section 6); not verifiable from the repository. Removed from the current tree already; history was deliberately not rewritten because the old values no longer work. |
| V2 | High | **Blocking did not work.** The messages insert policy from `015` looked up the `blocks` table, but blocks are readable only by the blocker, so for the blocked sender the lookup always found nothing and the message went through. Reproduced on a real Postgres. | **FIXED** (migration 017) |
| V3 | High | **Group key injection.** Any member could insert a group key envelope addressed to another member. Envelopes are anonymous sealed boxes, so a malicious member could hand a victim a group key the attacker knows. Reproduced. | **FIXED** (017: only group owners and admins) |
| V4 | High | **A conversation's creator could re-add themselves as owner (or add anyone) forever**, even after leaving or after ownership moved. Reproduced. | **FIXED** (017: creator may only seed a brand-new, empty conversation) |
| V5 | Medium | A sender could rewrite a message's `conversation_id`, `created_at`, `reply_to_message_id` (move it to another conversation, back-date it). Reproduced. Receipts could likewise be re-pointed. | **FIXED** (017 triggers) |
| V6 | Medium | Rate limits were keyed on the first `X-Forwarded-For` value, which any client can set, so every limit could be bypassed by changing a header. Limits were also per address only, never per account. | **FIXED** |
| V7 | Medium | No Content-Security-Policy at all. Any injected script could read the keys held in the browser. | **FIXED** |
| V8 | Medium | Realtime broadcast channels (typing, call signalling) were open to any signed-in user who knew a channel name (a user id or conversation id). | **FIXED in code and SQL**; needs 017 applied (see 5) |
| V9 | Medium | Profile photo URL was unrestricted: any user could make every viewer's browser fetch an arbitrary tracking URL. | **FIXED** (017 CHECK + CSP `img-src`) |
| V10 | Medium | Storage buckets had no size or type limit of their own, so the API's 25 MB check could be skipped by uploading straight to Storage. | **FIXED** (017) |
| V11 | Medium | API routes returned raw database error text (constraint names, policy text) to clients, and accepted unvalidated ids, unbounded arrays and unbounded ciphertext. | **FIXED** |
| V12 | Low | Upload filenames were only lightly sanitised; storage paths used a predictable timestamp. | **FIXED** |
| V13 | Low | Message edit could resurrect a deleted message and accepted non-boolean `deleted`. | **FIXED** |
| V14 | Low | Rate limiter put caller-influenced text into an Upstash request path and its memory map was unbounded. | **FIXED** |
| V15 | Low | Invite links could be created with unlimited lifetime and uses. | **FIXED** (017: at most 30 days, 250 uses) |
| V16 | Low | Group management routes did not check the conversation is a plain group, so they could be pointed at direct chats. | **FIXED** |
| V17 | Dependency (build time) | `postcss` <= 8.5.22 (high) nested in `next`; `vitest`/`@vitest/mocker` (moderate, dev only). | **FIXED** (`overrides`, vitest 4.1.11). `npm audit`: 0 vulnerabilities. |
| V19 | Medium | **A second browser silently broke the first.** A browser with no key minted a brand-new identity and registered it; peers pick the account's most recently active identity, so they started encrypting to the new one and the first device could no longer read new messages. There was also no cap on identity rows, and any holder of a session could keep swapping keys. | **FIXED** (app + 018) |
| V20 | Medium | **Floods.** Every request, including junk, reached Supabase (an auth lookup per request). Signed-in accounts could also write straight to the database and skip the API limits. | **FIXED for application-level floods** (middleware + 018). Volumetric DDoS is not something an app can stop: see section 5. |
| V18 | Info | Moving a membership row to another conversation looked possible from the update policy. Tested: it is **already stopped** because Postgres also applies the SELECT policy to the new row. Not a vulnerability. | PASS. A trigger was still added so the rule is explicit. |

## 2. Fixes made

- `database/migrations/017_security_hardening.sql` (new, safe to re-run): V2, V3, V4, V5, V8 (policies), V9, V10, V15, and the explicit membership guard from V18. **Must be applied.**
- `lib/api/security.ts` (new): UUID and date validation, trusted client address, per-address and per-account limits, cross-site request refusal, bounded JSON body reader, generic server errors, filename sanitiser.
- Every route under `app/api/**` and `app/auth/confirm` now uses it: ids validated, `sender_id` and other columns set only by the server, replies and threads must point inside the same conversation, sizes capped, errors generic, `Cache-Control: no-store`.
- `lib/rate-limit/rateLimiter.ts`: bounded memory, encoded Upstash key.
- `next.config.ts`: CSP (scripts, images, connections and frames restricted to this site and the Supabase project), HSTS with preload, COOP, CORP, `Permissions-Policy` extended, `no-store` on `/api`, powered-by header removed. `middleware.ts` header aligned.
- `lib/realtime/liveChannels.ts`, `lib/calls/CallManager.ts`: typing and call channels are now `private`.
- **Multi-device (V19):** all linked devices share the account's one key, so every browser reads the same chats, history and group keys with no protocol change. A browser with no key now stops at a "Link this device" screen (`components/auth/LinkDevice.tsx`, `lib/messaging/messagingCrypto.ts`) and links by restoring the passphrase-encrypted backup made on the first device, or explicitly starts fresh (old messages unreadable, contacts see a security-code change). Restoring a backup in Settings also registers the restored identity and removes the replaced one. If the account check fails the browser refuses to continue rather than minting a key.
- `database/migrations/018_devices_and_flood_limits.sql` (new, re-runnable): at most 3 registered identities per account (`limit_devices_per_user`); per-account write limits inside the database: 120 messages per minute, 200 reactions per minute, 30 new conversations per hour (`enforce_write_rate`). Writes with no signed-in user (SQL editor, service role) are not limited.
- `middleware.ts`: per-address limit before any Supabase call (300 per minute for `/api` and `/auth`, 600 per minute for pages), and a 2 MB body cap on `/api` (413).
- `package.json`: `overrides` for `postcss`, `vitest` 4.1.11. `.gitignore`: any `.env.*` except the example.

## 3. Security controls verified

All of the below were checked by tests that ran (section 4).

- **PASS** Multi-device: a browser with no key on an account that already has one is told to link and does not register a key; restoring the backup gives the same device id and public key; a wrong passphrase, an empty backup, and a failed device check are all refused (`tests/security/deviceLinking.test.ts`).
- **PASS** The 4th identity for an account is refused, re-registering an existing one still works, the cap is per account, and nobody can register a device for someone else (real Postgres).
- **PASS** The 121st message in a minute and the 31st conversation in an hour are refused in the database; other accounts are unaffected; trusted server writes are not limited.
- **PASS** Live flood: pages and `/api` return 429 past the limits, a 3 MB body returns 413.
- **PASS** Server-side authentication on every sensitive route; a forged bearer token or cookie is a 401 (Supabase's `getUser()` validates the token; the cookie is never trusted).
- **PASS** Membership is enforced by the API **and** by row level security: outsider C cannot read, post to, react to, edit, delete, or upload into A and B's conversation, and cannot list or read its attachments.
- **PASS** `sender_id` cannot be forged; edits change content only; another user cannot edit or delete a message.
- **PASS** Roles: a member cannot promote themselves or add people; only the owner promotes; an admin cannot remove the owner; a user cannot set `is_admin` on themselves; the admin route rejects non-admins.
- **PASS** Group key envelopes only from group admins, only to real member devices.
- **PASS** Blocking now prevents a blocked user from messaging the person who blocked them.
- **PASS** `email` and `phone_number` of other users are unreadable; the old email/phone lookup function is not callable.
- **PASS** Invites: stored hashed, unreadable to clients, wrong code rejected, valid code grants only `member`, a member cannot escalate or write community tables directly, outsiders cannot see communities.
- **PASS** Storage policies: conversation folders readable only by members; uploads only into a folder you belong to or your own; traversal-style names refused; both buckets limited to 25 MB and `application/octet-stream`.
- **PASS** Injection-shaped and malformed input is refused (non-UUID ids, `' OR 1=1`, `../`, PostgREST filter smuggling, wrong types, oversized or non-object JSON) before reaching the database. The routes and store code I read use the Supabase client's parameterised builder, with no string-built SQL.
- **PASS** Database error text is not returned to clients.
- **PASS** Rate limiting per account survives a spoofed `X-Forwarded-For` (live: 130 requests with 130 fake addresses were still cut off after 120).
- **PASS** Cross-site POST refused (403) before authentication.
- **PASS** Realtime authorization policies (typing and call topics) behave as designed on a Postgres with a Realtime stub.
- **PASS** Secrets: service-role key is read only in `lib/supabase/admin.ts` (server), is not `NEXT_PUBLIC_*`, and was searched for in the built client bundle (not present); no source maps are emitted; production with missing Supabase settings fails closed (500), not into demo mode.
- **PASS** Encryption is real: libsodium `crypto_box` (X25519 + XSalsa20-Poly1305) for direct messages, `crypto_secretbox` for groups with the key sealed per device, AES-256-GCM for attachments (code read; encryption tests already in the suite pass). Message rendering never uses `innerHTML`; links are http(s) only.
- **PASS** `npm audit`: 0 vulnerabilities. Install scripts exist only for `esbuild`, `fsevents`, `unrs-resolver`.

## 4. Tests actually performed and results

Final run: type check (with unused-code flags), lint, production build: all clean. **238 tests pass in 20 files** (was 146 before this audit). `npm audit`: 0 vulnerabilities.

- `tests/security/rls.test.ts` (56 tests): the project's own migrations 001 to 017 executed on a real Postgres (PGlite, WebAssembly) with Supabase roles and `auth.uid()` emulated, then attacked as separate identities with the API role: **A, B** (participants), **C** (outsider), **ADMIN**, plus D and E. Covers unauthenticated access, A to B reads and writes, forged senders, role escalation, membership and envelope abuse, message tampering, blocking, storage policies, communities and invites, reports, profile photo URLs, and realtime policies. A second block runs the schema **before** 017 and shows V2, V3, V4, V5 succeeding, so the fixes are proven to matter.
- `tests/security/apiSecurity.test.ts` (22 tests): the real route handlers with a stub database. Unauthenticated and forged-token requests, IDOR, ID tampering and injection strings, malformed and oversized bodies, type confusion, mass assignment, error-message leakage, per-account limits with spoofed headers, CSRF, upload filename traversal, admin route protection.
- `tests/security/floodAndDevices.test.ts` (8 tests, real Postgres) and `tests/security/deviceLinking.test.ts` (6 tests): the 018 limits and the link-a-new-browser flow.
- Live black-box against the production build (`next start`, fake Supabase settings): every sensitive route returned 401 with no or forged credentials; `/admin`, `/chat`, `/settings` redirected (307); cross-origin POST returned 403; security headers present on `/`; `/api/*` sent `no-store`; spoofed-address flood cut off at the limit; no service key and no source maps in the client bundle.

## 5. Remaining risks and unverified areas

- **BLOCKED / UNVERIFIED: nothing was run against a live Supabase project.** RLS was tested on real Postgres with an emulated Supabase, not on Supabase itself. Real sessions, email confirmation, password reset, Google sign-in, real Realtime delivery and Storage were not exercised. Run migration `017`, then repeat the two-account checklist in `docs/TESTING.md`.
- **Migration 017 is required.** Until it is applied: blocking does not work, key injection is possible, and the realtime channels the app now opens as `private` will be refused (typing indicators and calls stop working) because no policy allows them. Realtime Authorization may also need enabling in the Supabase dashboard.
- **The first account created on a fresh install becomes platform admin** (by design, `007`). On a public deployment, sign up as yourself first, and check `profiles.is_admin` is only you. Admins can read conversation and membership metadata (never message content).
- **Presence is still one global channel** (`pc-presence`): any signed-in user can see which user ids are online and their status. Not fixed: it needs a redesign, not a policy.
- **Any group member can read the group's ciphertext and metadata** (expected); envelopes are now admin-only, but there is still **no forward secrecy**. Devices are linked by sharing the one account key (up to 3 registered identities, any number of browsers can hold the key), so a lost or compromised device exposes the whole account, and "revoke device" only edits the registry: it cannot take the key back from a browser that already has it. Linking needs the backup file, so keep it and its passphrase safe. Linking was tested with a stubbed database, not with two real browsers. Private keys sit in IndexedDB unencrypted; a CSP now limits what can run, but an XSS bug would still expose them. The app lock is a screen lock, not encryption.
- **CSP keeps `'unsafe-inline'` for scripts** (Next.js bootstrap and the theme script). A nonce-based policy would need per-request rendering.
- **DDoS: the app cannot stop a volumetric attack.** The limits above protect the application and Supabase from cheap floods, but traffic that saturates bandwidth or the platform must be absorbed before it reaches the app: use Vercel Firewall / Attack Challenge Mode or Cloudflare in front, Supabase's built-in auth rate limits, and a CAPTCHA on sign-up (not added: needs keys from you). Sign-up, password reset and Google sign-in are limited by Supabase, not by this code.
- **Rate limits are per server instance** unless Upstash is configured (`UPSTASH_REDIS_REST_*`); on serverless, limits are weaker than they look. Upstash was not tested.
- **Direct Storage uploads** are bounded by size and type but not rate-limited, and any member can upload up to 25 MB files repeatedly into their conversations.
- Search-by-username is enforced by the app, not row level security: any signed-in user can still read the public profile columns (username, name, photo, bio) of ordinary people with the Supabase API. Since migration `023` this no longer applies to platform admins, who are visible only to people they share a chat or community with.
- Someone who blocked you is still findable in search (blocks are private to the blocker).
- Invite codes are 80 bits and hashed; there is no per-attempt lockout on `join_community` (guessing is not practical at that size).
- Not audited in depth: the admin dashboard pages, `types/database.ts` accuracy, the WebRTC/TURN flow beyond credential handling, and Supabase project settings (email rate limits, password policy, redirect allow-list).

## 6. Credentials that MUST be rotated

1. **Neon Postgres database password** (both the pooled and direct connection strings for endpoint `ep-gentle-shape-aylpm2jm`, us-east-2), found in git history at `server/.env.production` (commits `f92d7b5`, `4453243`). The repository is public. Rotate the role password in Neon, and check the database for unauthorised access.
2. **`JWT_SECRET`** from the same file. Rotate it and invalidate any sessions or tokens it signed.
3. Rotating is what matters: the values stay in public git history and in any clone or fork. Optionally rewrite history (for example with `git filter-repo`) and force-push, but treat the old values as public forever.
**Status:** the owner reported on 2026-09-20 that the Neon password and `JWT_SECRET` were changed. This cannot be checked from the repository. Neon's connection history for 27 August to the rotation date is worth a look for connections that were not yours.

4. Precaution: if a real Supabase service-role key was ever pasted into a local `.env` that was shared, rotate it too. None was found in the repository.

## Update 3: admin error and activity log (migration 019)

Added after the audit above, so it has had less scrutiny than the rest. Admins can read server and browser errors and an admin activity trail inside the app. Controls: reads restricted to platform admins by row level security; no client writes to either table; ingest only by server-only functions; audit log append-only; scrubbing of tokens, emails and long secrets before storage; authenticated, rate-limited, size-limited browser reporting route; 30-day retention and a 5,000-row cap. Tested on real Postgres (`tests/security/adminLogs.test.ts`), on the route (`tests/security/logIngest.test.ts`) and for scrubbing (`tests/ui/errorLogging.test.ts`). **Not verified against a live Supabase project.** Known limits: a signed-in user can send junk entries within the rate limit; browser errors before sign-in are not captured; the scrubber is pattern based and can miss unusual secrets, which is why message content and request bodies are never passed to it at all.

## Update 4: production audit pass (September 2026)

A second pass over design, performance, search and production quality. Security-relevant changes: the public landing, privacy and terms pages are now server-rendered HTML (no client script for the landing page); the privacy page no longer claims a protocol (Signal Double Ratchet) or a feature (self-service account deletion) that the product does not have; middleware skips the Supabase session lookup on public pages and API routes (each API route verifies the caller itself, as before) and answers 404 for `/design-system` in production; `/api` responses carry `X-Robots-Tag: noindex`; the Supabase Realtime `in()` filter is dropped above its 100-value limit (row level security remains the control); new `GET /api/messages/latest` derives the conversation list from the caller's own memberships and returns only known columns (`tests/security/latestRoute.test.ts`), backed by an invoker-rights function that leaves row level security in charge (`020`, `tests/security/latestMessages.test.ts`). Every state-changing route was re-checked for the cross-site guard, no `innerHTML`, `eval` or service-role use in browser code was found, and no secrets are tracked in git. **Not verified against a live Supabase project**, and no independent audit has taken place.
