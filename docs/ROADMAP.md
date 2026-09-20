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
| Settings area, Chat/Groups split, username-only people search | PR #13 |
| Unified design system and 3D landing page | PR #13 |
| Security hardening, several devices, flood protection, system theme, documentation | September 2026 (`SECURITY_AUDIT.md`) |
| Admin error log and activity log (Admin, Errors and Activity) | September 2026 (migration `019`) |

## What is verified

Everything passes type checking, lint, the production build, `npm audit` and 302 automated tests. The **database rules** (migrations `001` to `018`) are tested by running the real migrations on an in-process Postgres and attacking them as different users. The interface was exercised in local demo mode. **Not verified against a live Supabase project:** real sign-in and email, real Realtime delivery and Realtime Authorization, real Storage, communities end to end, key rotation on departure, disappearing messages, calls, and linking a second device in two real browsers. Migrations `013` to `017` were applied by the project owner to a live project in September 2026 and the presence of `017`'s objects was confirmed with check queries (`018` was added afterwards and its application has not been confirmed here); the behaviours above were not walked through. Use the checklists in [Testing](TESTING.md).

## Planned next

- Web Push notifications while the app is closed (needs a design that keeps message text off the push service)
- Group calls and screen sharing
- Second-device linking by QR code
- Stickers and GIFs, scheduled messages, custom community roles, channel categories, public community discovery
- Per-conversation presence instead of one global presence channel
- Per-device keys with fan-out encryption (would replace the shared account key; see [ADR 010](DECISIONS.md#adr-010-several-devices-share-one-account-key))
- Forward secrecy (a Double-Ratchet-style protocol; a redesign)
- A nonce-based Content-Security-Policy so inline scripts can be forbidden
- Encrypt the stored key at rest in the browser
- Account deletion and a full data export that includes decrypted history
- Move Argon2id and key generation to a Web Worker; CI workflow

## Security and hardening backlog

Fixed in September 2026 (see [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md)): profile email and phone exposure, the group-members authorization, the rate limiter and its client address, the Content-Security-Policy, Realtime channel authorization, and the vulnerabilities listed there. What remains, from [Security](SECURITY.md#known-gaps), in priority order:

1. Rotate the credentials found in git history (owner action, `SECURITY_AUDIT.md` section 6)
2. Add a CI workflow that runs type check, lint, tests, audit and build on every pull request
3. Run RLS tests against a real Supabase project (pgTAP or the Supabase CLI)
4. Move Argon2id and key generation to a Web Worker
5. Put security headers on redirects and error responses
6. Drop the unused `invites` table and `consume_invite()` function in a migration
7. Alert admins when a new error appears (email or push); the in-app log itself was added in `019`
8. Rate limit direct Storage uploads
9. Tighten `profiles` reads to contacts (touches every screen that shows a name)

## Known product gaps

- Pins and stars are stored only in the browser
- "Mark identity verified" in the conversation inspector is not connected
- The admin dashboard's per-user device count is a fixed `1`
- Devices share one key: losing one exposes the account, and "revoke device" cannot take the key back
- The landing page contains a static example conversation with made-up people; it should become a neutral illustration
- Live behaviour (Realtime, live row level security, email) has not been verified by automated tests; use the [manual checklist](TESTING.md#manual-checklist)
