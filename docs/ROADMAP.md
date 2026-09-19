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

## Planned features

**Phase 1a: live state**
- Server-backed unread counts (a `last_read_at` per member) and @mention badges
- Read receipts (sent, delivered, read), using the existing `message_receipts` table, with a setting to turn them off
- Online status and a manual status: Active, Do Not Disturb, Away (automatic after 5 minutes idle), In a meeting, using `presence`
- Typing indicators (ephemeral, nothing stored)
- Reactions that survive a refresh and update live

**Phase 1b: composer and everyday use**
- Text formatting (bold, italic, code, links), drag and drop and paste for images, voice note speed and waveform
- Browser notifications that respect Do Not Disturb
- Search that loads older history and matches decrypted messages in memory

**Phase 2: groups**
- Group admin role, rename, description and photo, leave with key rotation, system messages ([ADR 006](DECISIONS.md#adr-006-groups-had-no-roles-admin-roles-are-planned))
- Threads and polls
- Block and report user

**Phase 3: privacy**
- Disappearing messages
- Active sessions list and "log out other devices"
- App lock with a PIN
- Stretch: link a second device by QR (see the constraints in [E2EE](E2EE.md#limitations))

**Phase 4: calls**
- One-to-one voice and video over WebRTC with encrypted signalling and a hosted TURN relay

**Later**
- Web Push notifications, scheduled messages, channels and communities, stickers and GIFs

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
