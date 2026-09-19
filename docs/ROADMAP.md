# Roadmap

What is done, what is planned, and what is known to be missing. Each phase ships as its own pull request with its own migration, tests and manual checklist.

## Done

| Item | Where |
|---|---|
| V1 audit and rebuild: real encryption (libsodium), real persistence, attachments, voice, groups | [V1 status](V1_STATUS.md) |
| Open registration with password rules, email confirmation, resend, scrolling fixes | PR #2 |
| **Phase 0 foundations**: Realtime publication, live edits and deletes, new message kinds, camera and microphone permission headers | PR #3 |
| Continue with Google, profile names and photos from Google, unique usernames | PR #4 |
| Real failure reasons on the sign-in error screen | PR #5 |
| Documentation rewrite | PR #7 |
| Dead-code cleanup: removed the obsolete invite feature (API, admin panel, store, tests), unused components and helpers | this cleanup |

## What is verified

Everything in the **platform release** (see [Changelog](CHANGELOG.md)) passes type checking, lint, the production build and 111 unit tests, and the interface was exercised in local demo mode (themes, quick switcher, rich text, threads, notification menus, privacy settings). It has **not** been run against a live Supabase project: migrations `011` to `015`, real-time delivery, receipts, presence, communities, role enforcement, key rotation on departure, blocking, disappearing messages and calls are all written but untested end to end. Treat the first deployment as a test: apply the migrations in a staging project and walk through the checklist in [Testing](TESTING.md).

## Planned next

- Web Push notifications while the app is closed (needs a design that keeps message text off the push service)
- Group calls and screen sharing
- Second-device linking by QR code
- Stickers and GIFs, scheduled messages, custom community roles, channel categories, public community discovery
- Server-enforced authorization for presence, typing and call channels (Realtime Authorization)
- Account deletion and a full data export that includes decrypted history
- Move Argon2id and key generation to a Web Worker; Content Security Policy; CI workflow

## Security and hardening backlog

From [Security](SECURITY.md#known-gaps), in priority order:

1. Stop exposing profile email and phone to other signed-in users
2. Add an explicit authorization check to `DELETE /api/groups/members`; tighten who can add members
3. Fix the rate limiter (sliding window, trustworthy client address)
4. Add a Content Security Policy
5. Move Argon2id and key generation to a Web Worker
6. Put security headers on redirects and error responses
7. Drop the unused `invites` table and `consume_invite()` function in a migration
8. Add a CI workflow that runs type check, lint, tests and build on every pull request
9. Add an admin audit log

## Known product gaps

- Pins and stars are stored only in the browser
- "Mark identity verified" in the conversation inspector is not connected
- The admin dashboard's per-user device count is a fixed `1`
- No real multi-device support
- The landing page contains a static example conversation with made-up people; it should become a neutral illustration
- Live behaviour (Realtime, live row level security, email) has not been verified by automated tests; use the [manual checklist](TESTING.md#manual-checklist)
