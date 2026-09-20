# Decisions

The main architectural choices, why they were made, and where they stand. New decisions go at the bottom; when one is replaced, mark the old one **Superseded** rather than deleting it.

## ADR 001: libsodium instead of libsignal

- **Status:** Accepted. Replaced the original choice of `@signalapp/libsignal-client`.
- **Context:** The first design used the Signal protocol library. It ships only native Node.js binaries and cannot run in a browser; running it on the server would mean the server handles plaintext.
- **Decision:** Use `libsodium-wrappers` (WebAssembly): `crypto_box` for 1:1, a per-group `crypto_secretbox` key sealed to each member with `crypto_box_seal`, WebCrypto AES-256-GCM for files.
- **Consequences:** Works in browsers and tests, simple and reviewable. No Double Ratchet, so no forward secrecy or post-compromise security. Multi-device is handled by sharing one key (see [ADR 010](#adr-010-several-devices-share-one-account-key)). Raised first-load JavaScript from roughly 100 kB to roughly 380 kB, mostly libsodium's WebAssembly. Details in [E2EE](E2EE.md).

## ADR 002: Supabase is the source of truth; demo mode is development only

- **Status:** Accepted.
- **Context:** An earlier version kept conversations in `localStorage` and could silently run without authentication when configuration was missing.
- **Decision:** Conversations, messages, memberships and files live in Supabase. The seeded local demo exists only when `NODE_ENV` is not `production`. A production build with missing configuration returns HTTP 500.
- **Consequences:** No fake local persistence can masquerade as real. Development without a project is still possible, clearly labelled.

## ADR 003: Open registration with email confirmation and Google

- **Status:** Accepted. **Supersedes** the original invite-only registration.
- **Context:** Invite-only signup was first enforced only in the UI, then in a database trigger (`006`). The project owner wanted normal sign-up.
- **Decision:** Anyone can register with email and password (email must be confirmed) or Google. The signup trigger (`009`) only creates the profile. The first account becomes admin.
- **Consequences:** No invitation friction, but spam protection now rests on email confirmation and rate limits. The invite code, API and admin panel have since been removed; the `invites` table and `consume_invite()` function remain in the database, unused, and can be dropped in a later migration.

## ADR 004: Everything about a message lives inside the ciphertext

- **Status:** Accepted.
- **Decision:** `messages` stores only `ciphertext`, `nonce` and `encryption_version`. Message type, text, attachment path, name, type and key are inside a JSON envelope that is encrypted.
- **Consequences:** The server cannot index, search or preview content. Search, mentions and poll tallies are computed in the browser. New message kinds need no schema change.

## ADR 005: Argon2id for key backup

- **Status:** Accepted.
- **Decision:** Derive the backup key with Argon2id (64 MiB, 3 iterations, parallelism 4) via `hash-wasm`, encrypt with AES-256-GCM.
- **Consequences:** Strong resistance to offline guessing; needs about 64 MiB of memory and runs on the main thread for now.

## ADR 006: Groups had no roles; admin roles were then added

- **Status:** Accepted, then **implemented** in migration `013` (owner, admin, member; roles are enforced by database triggers and policies as well as the API). The text below records the original reasoning.
- **Context:** Migration `003` removed group roles to avoid authorization bugs; every member is equal. That leaves no way to stop anyone renaming a group or removing others.
- **Decision:** Reintroduce a group `admin` role in the groups upgrade ([Roadmap](ROADMAP.md)): the creator is admin and can promote others; only admins rename or remove people; anyone can leave.
- **Consequences:** Reverses the equal-member rule; requires a migration and updated policies and tests.

## ADR 007: Fail closed on missing configuration

- **Status:** Accepted.
- **Decision:** In production, missing or placeholder Supabase variables make the middleware return HTTP 500 instead of continuing unauthenticated. The service-role key is never available to browser code.

## ADR 008: Client-side features under end-to-end encryption

- **Status:** Accepted.
- **Decision:** Anything that needs message content (search, mentions, link previews, poll counts) runs in the browser on decrypted data and does not persist decrypted content. Server features are limited to metadata: unread counts, receipts, presence.
- **Consequences:** Bots and server-side integrations that read messages are out of scope unless they join as members and hold keys.

## ADR 009: Replace, don't patch, stale documentation

- **Status:** Accepted.
- **Context:** The earlier 37-file documentation set described a library we no longer use, an invite-only system, placeholder routes and files that no longer exist, and included specs for features the project never had.
- **Decision:** Replace it with a small set of documents written from the code (see [docs/README](README.md)). Changes that alter behaviour must update the matching document in the same pull request.

## ADR 010: Several devices share one account key

- **Status:** Accepted (September 2026).
- **Context:** Signing in on a second browser used to create a new key and register it. Contacts pick the account's most recently active key, so they began encrypting to the new browser and the first device silently stopped reading new messages. People want a phone and a computer.
- **Options considered:** (a) one key per device with every message encrypted to all of the recipient's and the sender's devices; (b) one shared account key, copied to new devices with the encrypted backup.
- **Decision:** (b). A browser with no key on an account that already has one shows "Link this device" and restores the backup instead of creating a key; "Start fresh" is an explicit, warned alternative. The database caps registered keys at 3 per account.
- **Why not (a):** it changes the stored message format, cannot show a new device old history, and group keys are given to devices by an *admin's* device (envelope creation is restricted to admins since migration `017`, so a normal member's new device could not receive group keys without redesign).
- **Consequences:** every device reads everything, including history, with no protocol change. The cost: compromise of any linked device or the backup exposes the whole account, and a key cannot be revoked from a device that has it. If per-device keys are ever wanted, that is a new `encryption_version` and a redesign of group key hand-off.

## ADR 011: The database is the authority; the API is an additional layer

- **Status:** Accepted (September 2026).
- **Context:** Signed-in users can talk to Supabase directly, bypassing the Next.js routes. A security review found several rules that only worked in the interface or the routes.
- **Decision:** Every rule that matters is enforced by row level security, triggers or constraints. The API routes repeat the checks (for clear errors and rate limiting) but are never the only defence. Shared route behaviour lives in `lib/api/security.ts`. Security tests run the project's real migrations on an in-process Postgres and attack them as different users (`tests/security/rls.test.ts`), including a run against the schema *before* a fix to prove the fix matters.
- **Consequences:** a rule that only exists in a route is a bug. Anything that needs a new database privilege goes in a migration with a test.

## ADR 012: The theme follows the device by default

- **Status:** Accepted (September 2026). **Supersedes** the earlier dark-only default.
- **Decision:** With no saved choice the app uses `data-theme="system"`, which follows the device's light or dark setting live. An explicit Dark or Light choice in Settings is respected. The landing page's product-mock cards and the call overlay stay dark on purpose.

## ADR 013: Denial-of-service protection is layered, and the app is only one layer

- **Status:** Accepted (September 2026).
- **Decision:** The app limits cheap floods (per-address limit in middleware before any Supabase call, per-route and per-account limits, body caps, database write limits). Volumetric attacks must be absorbed by a firewall or CDN in front of the app, and sign-up abuse by Supabase's rate limits and, if needed, a CAPTCHA. These are documented as deployment steps ([Security](SECURITY.md#denial-of-service)) because they cannot be done from this repository.
- **Consequences:** in-memory limits are per server instance unless Upstash is configured; they are a safety net, not a shield.

## ADR 014: Admins get an in-app error and activity log

- **Status:** Accepted (September 2026).
- **Context:** Technical error detail is shown only to admins, but the only place server errors were visible was the hosting and database dashboards, which the owner does not want to share with every admin.
- **Decision:** Keep an error log and an append-only admin activity log in the database, readable only by admins through row level security and shown in the Admin area. Writes go only through server-only database functions (nobody can write to the tables directly), the browser reports through an authenticated, rate-limited route, and all text is scrubbed of secrets and personal data first. Same problem = one row with a counter. Retention 30 days plus a 5,000-row cap. The affected user is recorded (agreed with the owner) so admins can help that person.
- **Consequences:** admins can work without Supabase or Vercel access. The log is only as complete as what is reported: errors before sign-in are not captured from the browser, and a signed-in user can send junk entries within the limits. It is not a replacement for real monitoring at scale.

## ADR 015: Vercel Web Analytics, with the address reduced to its path

- **Status:** Accepted (September 2026). **Relaxes** the earlier rule of "no analytics or tracking scripts".
- **Context:** The owner wanted to see how many people visit. A pull request added Vercel Web Analytics (`@vercel/analytics`). It is cookieless page-view counting, but pages can carry private values in the address (an invite is `/?join=CODE`).
- **Decision:** Keep it, wrapped so it runs only in production builds and only ever receives the origin and path (`lib/analytics.ts`). No other analytics, advertising or tracking script is allowed, and nothing from inside the app is reported to it. The privacy policy page states it.
- **Consequences:** page counts without cookies or a consent banner, and a third party (Vercel, which already hosts the site) sees page paths and general visitor details. If the site is ever hosted elsewhere, remove it.
