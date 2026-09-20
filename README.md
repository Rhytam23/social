# Nook

A private messaging web app with **end-to-end encryption**. Sign in with email or Google, find people, chat one-to-one or in groups, and share files and voice notes. Message contents are encrypted in your browser and the server only ever stores ciphertext.

Built with Next.js 15, React 19, TypeScript, Tailwind CSS and Supabase (Auth, Postgres, Realtime, Storage).

> **Status: pre-production (documentation last brought up to date September 2026).** The messaging, encryption, auth and file pipelines are implemented and covered by automated tests, and the database security rules were reviewed and tested against a real Postgres. Not everything has been exercised end to end against a live Supabase project, and some features are still on the [roadmap](docs/ROADMAP.md). See [Known limitations](#known-limitations) and [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) before relying on it.

> **Picking this project up after a long time, or for the first time? Read the [Maintainer guide](docs/MAINTAINER_GUIDE.md) first.** It explains the ideas, the layout, how to rebuild everything, and what to re-check as the underlying products age. Everything else is linked from the [documentation index](docs/README.md).

---

## Features

**Accounts**
- Sign up with email and password (email confirmation required) or **Continue with Google**
- Password reset by email, inline validation, resend-confirmation flow
- First-run onboarding; **the first account created on a fresh install becomes the platform admin** (sign up as yourself first)
- **Several devices**: link a phone and a computer to one account with the encrypted key backup (see [E2EE](docs/E2EE.md#keys-and-linking-devices))

**Messaging**
- Direct chats and group chats, message history loaded from the database
- Live delivery of new messages, edits and deletes (Supabase Realtime)
- Replies, edit, delete, forward, emoji reactions
- Honest send states: `sending`, `sent`, `failed` with retry (never marked delivered when the server rejected it)
- Encrypted file attachments (images up to 10 MB, videos up to 100 MB, other files up to 25 MB, all within a per-account daily quota) and voice notes with real playback

**Encryption** (details in [`docs/E2EE.md`](docs/E2EE.md))
- 1:1 messages: X25519 key agreement with XSalsa20-Poly1305 (libsodium)
- Groups: one symmetric key per group, sealed to every member's device key, rotated when members change
- Attachments: AES-256-GCM in the browser before upload
- Key backup: export and restore your account key, protected by a passphrase (Argon2id + AES-GCM). Restoring it on another browser is how a second device is linked
- Safety numbers to compare identities

**People, groups, settings**
- Find people by exact username (names, email addresses and phone numbers are not searchable and email/phone are never returned)
- Create groups, add and remove members, group key rotation on every change
- Profile photo upload, notification permission, key backup and device list
- Admin dashboard: roles, reports, the error log and admin activity

**Platform features** (need migrations 011 to 025; see [Roadmap](docs/ROADMAP.md#what-is-verified) for what has and has not been tested)
- Themes: **follows the device's light or dark setting by default**, or choose Dark or Light; quick switcher (Ctrl+K), keyboard shortcuts, accessible dialogs
- Profiles with bio, pronouns and time zone; presence statuses; typing indicators; read receipts
- Group roles, admin-only posting, threads, saved messages, @mentions, message formatting
- Communities with public and private channels and invite links
- Notification controls (mute, mentions-only, quiet hours, keywords), disappearing messages, blocking, reporting, app lock
- One-to-one voice and video calls (WebRTC, encrypted signalling, optional TURN)

**Security and abuse protection** (details in [`docs/SECURITY.md`](docs/SECURITY.md) and [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md))
- Row level security on every table, integrity triggers, a Content-Security-Policy and other headers, private Realtime channels
- Rate limits per address and per account, request size caps, cross-site request checks, database write limits, a cap of 3 registered keys per account
- A test suite that runs the real migrations on an in-process Postgres and attacks them as different users
- **An admin error and activity log inside the app** (Admin, Errors and Activity): server and browser errors and admin actions, readable by admins only, so admins need no Supabase or hosting access

**Local demo mode**: run the UI with no backend for development (see [Demo mode](#demo-mode)). It can never run in a production build.

---

## Quick start

You need Node.js 20+, npm, and a free [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/Rhytam23/social.git
cd social
npm install
cp .env.example .env.local     # then fill in the three Supabase values
```

1. Create a Supabase project and copy the **Project URL**, **anon key** and **service_role key** (Project Settings → API) into `.env.local`.
2. In the Supabase **SQL Editor**, run every file in `database/migrations/` **once, in strict numeric order** (`001` to `025`). Each needs the ones before it. `017` and `018` carry security fixes; `020` is a performance improvement the app works without.
3. In Supabase → Authentication, turn on **Confirm email** and add `http://localhost:3000/auth/confirm` to the Redirect URLs. Make sure Realtime Authorization is set up so typing indicators and calls work (see [Setup](docs/SETUP.md#6-verify-the-storage-buckets-and-realtime)).
4. Start the app:

```bash
npm run dev      # http://localhost:3000
```

The full walkthrough, including Google sign-in, is in [`docs/SETUP.md`](docs/SETUP.md). If something goes wrong, see [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md).

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL. Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public `anon` key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | **Secret.** Bypasses row level security. Never prefix it with `NEXT_PUBLIC_` and never commit it. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | No | Shared rate limiting across multiple server instances. Without them, limits are kept in memory per instance. |

`NEXT_PUBLIC_*` values are baked into the build. After changing them on a host such as Vercel, redeploy.

### Demo mode

With no Supabase variables set, `npm run dev` runs a local demo with seeded example people and messages (clearly labelled as demo data, not encrypted). In a production build, missing variables make the server return HTTP 500 instead of silently running without authentication.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest test suite |
| `npx tsc --noEmit` | Type check |
| `npm audit` | Known-vulnerability check of the dependencies |

---

## How it works

```
Browser                                              Supabase
┌───────────────────────────────┐                    ┌──────────────────────────┐
│ React UI + ChatStore          │   ciphertext only  │ Postgres (RLS on every   │
│ MessagingCrypto (libsodium)   ├───────────────────►│ table), Auth, Realtime,  │
│ IndexedDB: your private key   │◄───────────────────┤ Storage (private bucket) │
└───────────────────────────────┘   Next.js /api/*   └──────────────────────────┘
```

1. On first login your browser generates a key pair. The private key stays in IndexedDB; the public key is published.
2. To send a message the browser encrypts it for the recipient (or for the group key) and posts `ciphertext` and `nonce`.
3. The server checks you are a member of the conversation and stores the ciphertext. Everything else about the message, including attachment names and keys, lives *inside* the encrypted payload.
4. Other members receive it over Realtime and decrypt it locally.

More in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/E2EE.md`](docs/E2EE.md).

### Project structure

```
app/          Next.js routes: pages, /api route handlers, /auth/confirm
middleware.ts First flood limit, session refresh, route protection, security headers
components/   UI by area: auth, chat, messages, groups, community, calls, settings, landing, layout, ui, ...
crypto/       Browser encryption: keys, 1:1, groups, attachments, backup (libsodium, WebCrypto)
lib/          store/ (ChatStore), messaging/ (crypto orchestration, envelopes), api/ (shared route security helpers),
              rate-limit/, supabase/, auth/, calls/, realtime/, ui/ (theme)
database/     SQL migrations 001-025: the only definition of the schema
docs/         Documentation (start at docs/README.md or docs/MAINTAINER_GUIDE.md)
hooks/        React hooks
tests/        Vitest suites (tests/security runs the real migrations on an in-process Postgres)
types/        Shared TypeScript types, database types
```

---

## Testing

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build && npm audit
```

432 automated tests (at the time of writing) cover the encryption layer, the database security rules (the real migrations run on an in-process Postgres and attacked as several users), API route security, device linking, flood limits, the message store and the UI logic. They do **not** cover the UI in a real browser, two real browsers linking a device, or anything that needs a live Supabase project (Realtime delivery, real email, Realtime Authorization). [`docs/TESTING.md`](docs/TESTING.md) has manual checklists for those.

---

## Deployment

Deploy to Vercel (or any Node host): set the three Supabase variables (mark the service-role key as sensitive) and `NEXT_PUBLIC_SITE_URL` (your production address, used for canonical links, the sitemap and link previews), add your production URL to Supabase's Site URL and Redirect URLs, and redeploy after any `NEXT_PUBLIC_*` change. Put a firewall in front for abuse protection: the app's own limits stop cheap floods, not a volumetric DDoS. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [Security](docs/SECURITY.md#denial-of-service).

---

## Known limitations

- **No forward secrecy.** 1:1 messages use a long-lived key pair per user, so a stolen private key exposes past messages that were captured as ciphertext.
- **Devices share one key.** A second device is linked by restoring the key backup, so losing any linked device (or the backup and its passphrase) exposes the whole account, and a key cannot be revoked from a device that has it. An account can register at most 3 keys.
- **The key sits unencrypted in the browser's storage**, so a script-injection bug would expose it. The Content-Security-Policy limits that but still allows inline scripts.
- **The server sees metadata**: who is in which conversation, timestamps, message and attachment sizes.
- **Public keys are served by the database.** A malicious server could swap a key; compare safety numbers to detect it. The "mark verified" button is not wired up yet.
- Pins are stored only in your browser; saved messages, reactions and read state are stored on the server (ids only).
- A group member who has never signed in cannot get the group key until it is re-shared.
- The database rules were tested on a real Postgres with an *emulated* Supabase, not on a live Supabase project (see the [roadmap](docs/ROADMAP.md#what-is-verified)). Realtime Authorization, real email and sign-in flows were not exercised end to end.
- Presence (who is online) is one shared channel that any signed-in user can read.
- Search covers messages loaded on this device only; notifications only work while the app is open in a browser tab.
- New community members can read a channel only after an admin's device shares its key, so an admin must have the app open.
- Calls may not connect on strict networks unless you configure a TURN relay.

The complete list, and what is planned, is in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## License

This project is **source-available, not open source**. The [Nook Non-Commercial Learning License](LICENSE) lets you clone, run, read and modify it **for your own personal, non-commercial learning and testing**. You may **not** use it commercially, **not** use it in any hackathon, competition or contest, **not** run it as a service for other people, and **not** publish or redistribute it or a modified copy. Using it in a way the license does not allow ends your permission and may lead to action against you.

For any other use, email **rhytam.biswas0823@gmail.com** and ask first.

## Documentation

| Document | What's in it |
|---|---|
| [Maintainer guide](docs/MAINTAINER_GUIDE.md) | **Start here when returning after a long time**: ideas, repository map, glossary, rebuild steps, runbook, what will age |
| [Setup](docs/SETUP.md) | Supabase project, migrations, auth settings, Google sign-in, first run, linking a second device |
| [Deployment](docs/DEPLOYMENT.md) | Vercel, environment, release checklist, rollback |
| [Design](docs/DESIGN.md) | Design tokens, shared components, the landing page and its performance rules |
| [Architecture](docs/ARCHITECTURE.md) | Components, data flows, routes, state |
| [E2EE](docs/E2EE.md) | Cryptographic design and its limits |
| [Database](docs/DATABASE.md) | Tables, functions, security rules, storage, migrations |
| [API](docs/API.md) | Route reference |
| [Security](docs/SECURITY.md) | Threat model, controls, denial-of-service layers, rules and known gaps |
| [Security audit](SECURITY_AUDIT.md) | The September 2026 review: vulnerabilities found and fixed, tests, remaining risks, credentials to rotate |
| [Testing](docs/TESTING.md) | Automated tests and the manual checklist |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Fixes for problems people actually hit |
| [Decisions](docs/DECISIONS.md) | Why things are built this way |
| [Roadmap](docs/ROADMAP.md) | What is planned |
| [Changelog](docs/CHANGELOG.md) | History |
| [Contributing](docs/CONTRIBUTING.md) | Workflow and rules |
| [V1 status](docs/V1_STATUS.md) | The V1 audit report |
