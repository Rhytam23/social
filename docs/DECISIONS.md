# Decisions

The main architectural choices, why they were made, and where they stand. New decisions go at the bottom; when one is replaced, mark the old one **Superseded** rather than deleting it.

## ADR 001: libsodium instead of libsignal

- **Status:** Accepted. Replaced the original choice of `@signalapp/libsignal-client`.
- **Context:** The first design used the Signal protocol library. It ships only native Node.js binaries and cannot run in a browser; running it on the server would mean the server handles plaintext.
- **Decision:** Use `libsodium-wrappers` (WebAssembly): `crypto_box` for 1:1, a per-group `crypto_secretbox` key sealed to each member with `crypto_box_seal`, WebCrypto AES-256-GCM for files.
- **Consequences:** Works in browsers and tests, simple and reviewable. No Double Ratchet, so no forward secrecy or post-compromise security; no real multi-device. Raised first-load JavaScript from roughly 100 kB to roughly 380 kB, mostly libsodium's WebAssembly. Details in [E2EE](E2EE.md).

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

## ADR 006: Groups had no roles; admin roles are planned

- **Status:** Accepted, with a change decided.
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
