# Private Chat

A private messaging web app with **end-to-end encryption**. Sign in with email or Google, find people, chat one-to-one or in groups, and share files and voice notes. Message contents are encrypted in your browser and the server only ever stores ciphertext.

Built with Next.js 15, React 19, TypeScript, Tailwind CSS and Supabase (Auth, Postgres, Realtime, Storage).

> **Status: pre-production.** The messaging, encryption, auth and file pipelines are implemented and covered by automated tests. Not everything has been exercised end to end against a live backend, and some features are still on the [roadmap](docs/ROADMAP.md). See [Known limitations](#known-limitations) and [`docs/V1_STATUS.md`](docs/V1_STATUS.md) before relying on it.

---

## Features

**Accounts**
- Sign up with email and password (email confirmation required) or **Continue with Google**
- Password reset by email, inline validation, resend-confirmation flow
- First-run onboarding; the first account created becomes the admin

**Messaging**
- Direct chats and group chats, message history loaded from the database
- Live delivery of new messages, edits and deletes (Supabase Realtime)
- Replies, edit, delete, forward, emoji reactions
- Honest send states: `sending`, `sent`, `failed` with retry (never marked delivered when the server rejected it)
- Encrypted file attachments (up to 25 MB) and voice notes with real playback

**Encryption** (details in [`docs/E2EE.md`](docs/E2EE.md))
- 1:1 messages: X25519 key agreement with XSalsa20-Poly1305 (libsodium)
- Groups: one symmetric key per group, sealed to every member's device key, rotated when members change
- Attachments: AES-256-GCM in the browser before upload
- Key backup: export and restore your identity key, protected by a passphrase (Argon2id + AES-GCM)
- Safety numbers to compare identities

**People, groups, settings**
- Search people by name, username, email or phone (email and phone are never returned)
- Create groups, add and remove members, group key rotation on every change
- Profile photo upload, notification permission, key backup and device list
- Admin dashboard for roles

**Platform features** (need migrations 011 to 015; see [Roadmap](docs/ROADMAP.md#what-is-verified) for what has and has not been tested)
- Themes (dark, light, system), quick switcher (Ctrl+K), keyboard shortcuts, accessible dialogs
- Profiles with bio, pronouns and time zone; presence statuses; typing indicators; read receipts
- Group roles, admin-only posting, threads, saved messages, @mentions, message formatting
- Communities with public and private channels and invite links
- Notification controls (mute, mentions-only, quiet hours, keywords), disappearing messages, blocking, reporting, app lock
- One-to-one voice and video calls (WebRTC, encrypted signalling, optional TURN)

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
2. In the Supabase **SQL Editor**, run every file in `database/migrations/` **once, in order** (`001` to `009`).
3. In Supabase → Authentication, turn on **Confirm email** and add `http://localhost:3000/auth/confirm` to the Redirect URLs.
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
components/   UI by area: auth, chat, messages, groups, people, settings, admin, layout, ui
crypto/       Browser encryption: keys, 1:1, groups, attachments, backup (libsodium, WebCrypto)
lib/          store/ (ChatStore), messaging/ (crypto orchestration, envelopes), supabase/, auth/, rate-limit/
database/     SQL migrations 001-009 and helper functions
docs/         Documentation
hooks/        React hooks
tests/        Vitest suites
types/        Shared TypeScript types, database types
```

---

## Testing

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

64 automated tests cover the encryption layer, security and authorization rules, API route authentication, the message store and message display. They do **not** cover the UI in a real browser or anything that needs a live Supabase project (Realtime delivery, live row level security, email). [`docs/TESTING.md`](docs/TESTING.md) has a manual two-account checklist for those.

---

## Deployment

Deploy to Vercel (or any Node host): set the three Supabase variables (mark the service-role key as sensitive), add your production URL to Supabase's Site URL and Redirect URLs, and redeploy after any `NEXT_PUBLIC_*` change. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Known limitations

- **No forward secrecy.** 1:1 messages use a long-lived key pair per user, so a stolen private key exposes past messages that were captured as ciphertext.
- **One device per account for encryption.** Signing in on a new browser creates a new device key unless you restore your key backup.
- **The server sees metadata**: who is in which conversation, timestamps, message and attachment sizes.
- **Public keys are served by the database.** A malicious server could swap a key; compare safety numbers to detect it. The "mark verified" button is not wired up yet.
- Pins are stored only in your browser; saved messages, reactions and read state are stored on the server (ids only).
- A group member who has never signed in cannot get the group key until it is re-shared.
- Migrations 011 to 015 and the new features have not been verified against a live Supabase project (see the [roadmap](docs/ROADMAP.md#what-is-verified)).
- Search covers messages loaded on this device only; notifications only work while the app is open in a browser tab.
- New community members can read a channel only after an admin's device shares its key, so an admin must have the app open.
- Calls may not connect on strict networks unless you configure a TURN relay.

The complete list, and what is planned, is in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Documentation

| Document | What's in it |
|---|---|
| [Setup](docs/SETUP.md) | Supabase project, migrations, auth settings, Google sign-in, first run |
| [Deployment](docs/DEPLOYMENT.md) | Vercel, environment, release checklist, rollback |
| [Architecture](docs/ARCHITECTURE.md) | Components, data flows, routes, state |
| [E2EE](docs/E2EE.md) | Cryptographic design and its limits |
| [Database](docs/DATABASE.md) | Tables, functions, security rules, storage, migrations |
| [API](docs/API.md) | Route reference |
| [Security](docs/SECURITY.md) | Controls, rules and known gaps |
| [Testing](docs/TESTING.md) | Automated tests and the manual checklist |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Fixes for problems people actually hit |
| [Decisions](docs/DECISIONS.md) | Why things are built this way |
| [Roadmap](docs/ROADMAP.md) | What is planned |
| [Changelog](docs/CHANGELOG.md) | History |
| [Contributing](docs/CONTRIBUTING.md) | Workflow and rules |
| [V1 status](docs/V1_STATUS.md) | The V1 audit report |
