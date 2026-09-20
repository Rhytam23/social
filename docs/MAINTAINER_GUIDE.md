# Maintainer guide

**Read this first if you have inherited this project, or come back to it after a long time.** It assumes you know web development but nothing about this codebase. It was written in **September 2026**; where it names a product, version or service, check that it still exists in the form described before you rely on it.

## What this is

Nook is a web messenger where **message contents are encrypted in the user's browser** and the server only ever stores ciphertext. It has direct chats, groups, communities with channels, threads, files, voice notes, voice and video calls, and an admin role. People sign in with email or Google.

It is a web app (Next.js) on top of a hosted database service (Supabase). There is **no separate backend server of our own**: the "server" is a set of thin Next.js API routes plus the database's own rules.

## The five ideas that explain everything

1. **The browser does the cryptography.** Keys are made and kept in the browser (IndexedDB). The server and database can never read a message. This is why there is no server-side search, no message previews in push notifications, and no "reset your password and get your messages back". See [E2EE](E2EE.md).
2. **The database rules are the real security.** Every table has Postgres *row level security* (RLS). The API routes add checks and rate limits, but if a route were bypassed, RLS must still refuse. Never rely on the interface, the routes, or `localStorage` to protect data. See [Database](DATABASE.md) and [Security](SECURITY.md).
3. **Everything about a message is inside the ciphertext.** The database has `ciphertext`, `nonce` and a version number, not "text", "type" or "attachment name". New message kinds need no schema change.
4. **One client-side store.** `lib/store/chatStore.ts` holds all app state; components subscribe to it. Real mode talks to Supabase; a development-only demo mode uses fake data.
5. **Migrations are the schema.** The database is defined only by the numbered SQL files in `database/migrations/`, applied once each, in order, by hand in the Supabase SQL editor. There is no migration runner.

## Map of the repository

| Path | What is there |
|---|---|
| `app/` | Next.js App Router. `page.tsx` is a server component: the public landing page (real HTML for search engines) wrapped in `components/app/HomeGate.tsx`, which loads the chat application (`components/app/AppRoot.tsx`: boot, sign-in gate, "Link this device" screen, chat shell) only for visitors with a session. `robots.ts`, `sitemap.ts`, `manifest.ts`, `icon.svg` and `opengraph-image.tsx` are the search and sharing files (address from `lib/site.ts`). `app/api/*` are the route handlers. `app/auth/confirm` handles email and Google sign-in redirects. `app/(auth)/*` are sign-in pages. `app/design-system/*` are development-only preview pages |
| `middleware.ts` | Runs before every page and API request: a first flood limit, session refresh, route protection, security headers |
| `next.config.ts` | Content-Security-Policy and other response headers |
| `components/` | UI grouped by area (`chat`, `messages`, `groups`, `community`, `settings`, `calls`, `landing`, `auth`, `ui`, ...) |
| `lib/store/` | `chatStore.ts`, the client state and actions |
| `lib/messaging/` | `messagingCrypto.ts` (the browser's key holder and encryptor), `envelope.ts` (what is inside a message), `messageService.ts` |
| `lib/api/security.ts` | Shared helpers every API route uses: id validation, trusted client address, rate limits, cross-site check, body-size caps, generic errors |
| `lib/rate-limit/` | The rate limiter (in memory, or Upstash Redis if configured) |
| `lib/supabase/` | Browser, server and admin Supabase clients; environment checks |
| `lib/logging/` | The admin error log: scrubbing, the server writer, the browser reporter |
| `lib/calls/`, `lib/realtime/` | WebRTC calls; presence and typing channels |
| `crypto/` | The cryptographic primitives (libsodium, WebCrypto, Argon2id). Small and self-contained on purpose |
| `database/migrations/` | **The schema.** `001` to `022` |
| `types/database.ts` | Hand-maintained TypeScript mirror of the schema |
| `tests/` | Vitest suites. `tests/security/` runs the real migrations on an in-process Postgres and attacks them |
| `docs/` | This documentation |
| `SECURITY_AUDIT.md` | A dated snapshot of a full security review (September 2026) |

## Life of one message

1. The user types text. `chatStore` wraps it in an envelope (`{ v: 1, kind: 'text', text }`).
2. `MessagingCrypto` encrypts it: for a direct chat with the other person's public key (`crypto_box`); for a group with the group key (`crypto_secretbox`).
3. The browser `POST`s `{ conversationId, ciphertext, nonce }` to `/api/messages`. The route authenticates the session, rate limits, checks membership and inserts the row. RLS checks again.
4. Postgres publishes the new row through Supabase Realtime to every member who is allowed to see it.
5. The other browser decrypts it and shows it.

## Glossary

| Term | Meaning here |
|---|---|
| **RLS** | Row level security: Postgres rules that decide, per row, who can read or change it. The main line of defence |
| **anon key** | Supabase's public key, shipped to browsers. Safe to expose *because* RLS exists |
| **service-role key** | Supabase's secret key that bypasses RLS. Server only. Used in one place (`lib/supabase/admin.ts`) |
| **Envelope** | The JSON that is encrypted inside every message: its kind, text, attachment keys |
| **Device key / account key** | An X25519 key pair. All of a person's linked devices share **one** key. See [E2EE](E2EE.md#keys-and-linking-devices) |
| **Linking a device** | Putting the account key into a second browser by restoring the passphrase-protected backup file |
| **Group key** | A random symmetric key per group, sealed separately to each member's device key ("envelopes" in `group_key_envelopes`) and replaced when membership changes |
| **Key backup** | A file holding the account key, encrypted with a passphrase (Argon2id + AES-GCM). The only way to move or recover keys |
| **Safety number** | A short fingerprint of two people's keys, compared out of band to detect a swapped key |
| **Demo mode** | Development-only fake data used when no Supabase variables are set. Impossible in a production build |
| **Migration** | One numbered SQL file. Applied once, in order. Never edited after being applied anywhere |

## Rebuilding from nothing

1. Install a current LTS Node.js and npm. Clone the repository. `npm install`.
2. Create a Supabase project. Copy `.env.example` to `.env.local` and fill in the three Supabase values.
3. Apply every file in `database/migrations/` in order ([Setup](SETUP.md#3-run-the-database-migrations)). Run `009` after `005` to `007` if you replay them.
4. Configure Authentication (confirm email on, Site URL, Redirect URLs, SMTP) and Google if wanted.
5. Enable **Realtime Authorization** for the project (needed for private typing and call channels; see [Setup](SETUP.md#6-verify-the-storage-buckets-and-realtime)).
6. `npm run dev`. **Sign up as yourself first: the first account created becomes the platform admin.**
7. Run the checks below, then the [manual two-account checklist](TESTING.md#manual-checklist).

## Health check

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build && npm audit
```

At the time of writing this gives: no type or lint errors, **360 tests passing in 36 files**, a compiling build and zero audit findings. The exact numbers will drift; what matters is that all commands succeed. A red `tests/security/rls.test.ts` means a database rule no longer holds: treat it as a security defect, not a test problem.

## What will change over ten years (and what to check)

| Dependency | What this project assumes | When it breaks or ages |
|---|---|---|
| **Supabase** | Auth cookies via `@supabase/ssr`; RLS with `auth.uid()`; Storage tables `storage.objects` and `storage.buckets`; Realtime `postgres_changes` and *Realtime Authorization* (`realtime.messages`, `realtime.topic()`); `supabase_realtime` publication | Any of these APIs or schema names may change. Migrations `004`, `008` and `017` touch them and are the first place to look. Re-run the security test suite against the new behaviour |
| **Next.js / React** | App Router, route handlers, middleware, React 19. Route files may only export HTTP handlers (helpers live in `lib/api/security.ts` for that reason) | Major upgrades change middleware, caching and header handling. `next.config.ts` holds the CSP |
| **libsodium-wrappers** | `crypto_box`, `crypto_secretbox`, `crypto_box_seal` (X25519, XSalsa20-Poly1305) | These are sound today. If they are ever weakened, use the per-message `encryption_version` field to introduce a new scheme and keep reading old messages |
| **hash-wasm (Argon2id)** | 64 MiB, 3 iterations, parallelism 4 | Raise the parameters as hardware improves. The backup file stores its parameters, so old backups still open |
| **Web platform** | IndexedDB, Web Crypto (AES-GCM), WebAssembly, WebRTC, `matchMedia` | Stable, but browsers do tighten IndexedDB storage rules and WebRTC privacy behaviour |
| **Tailwind 3, Geist** | Design tokens are CSS variables | Cosmetic. Tailwind 4 changes configuration |
| **Vercel** | Hosting and Deployment Protection settings | Any Node host works. See [Deployment](DEPLOYMENT.md) |
| **Upstash Redis** | Optional shared rate-limit store, used through its REST API | If absent, limits are per server instance and weaker |

**Cryptography ages.** Nothing here is forward-secret ([E2EE](E2EE.md#limitations)). If you have the resources, the largest single improvement is a Double-Ratchet-style protocol, which is a redesign, not a patch.

## Third parties that see anything

Keep this list short and true. Supabase (database, sign-in, storage, realtime) sees ciphertext and metadata. The host (Vercel) serves the site and, if you enable it, Vercel Web Analytics counts page views: it receives only origin and path (`lib/analytics.ts` strips everything after the path). Google, if sign-in with Google is on. An optional TURN relay sees encrypted call media. Nothing else: no advertising or tracking scripts.

## Rules that must never be broken

These are what a review should defend. The full list is in [Security](SECURITY.md#rules-for-contributors).

1. No plaintext message content on the server: no `content` column, no logging of decrypted text.
2. The service-role key never reaches browser code or a `NEXT_PUBLIC_` variable.
3. Every table has RLS, and no policy grants a user more access than they need. Adding a column that others should see requires adding it to the column grant ([Database](DATABASE.md#added-by-migrations-011-to-016)).
4. Admin status comes from `profiles.is_admin` only.
5. Security checks live server side and in the database, never only in the interface.
6. Never edit an applied migration; add a new one that is safe to run twice.
7. Never claim something is tested when it was not. Say what was not verified.

## Operations runbook

| Situation | What to do |
|---|---|
| **A secret was exposed** (service-role key, database password, `JWT_SECRET`, an `.env` file in git) | Rotate it at the source (Supabase → Project Settings → API; the database provider), update the host's environment variables, redeploy. Assume anything in public git history is permanently public. See `SECURITY_AUDIT.md` section 6 for the credentials that had to be rotated in 2026 |
| **A migration fails halfway** | Read the error, fix the cause, run it again: migrations `011` and later are written to be re-run. Do not re-run `002` or `003` on a live database |
| **You are not sure which migrations were applied** | Use the read-only check queries in [Setup](SETUP.md#3-run-the-database-migrations) |
| **Someone wrote to support** | Open the app as an admin: **Admin, Support**. Requests from the contact form and Settings, Report a problem are listed with the sender's email; Reply by email opens your mail app; Mark resolved when done. Nothing is emailed to you automatically, so check the tab regularly (or the address on the Contact page). If it says "not available", check that migration `022` is applied |
| **Users say something is broken** | Open the app as an admin: **Admin, Errors**. Server and browser errors are listed with how often, when, on which page and for which user, with no message content or secrets. Mark them resolved when fixed; **Activity** shows what other admins did. No Supabase or hosting access is needed, so this is where 3 or 4 admins should look first. If the list is empty or says "not available", check that migration `019` is applied |
| **Someone is flooding the site** | Turn on the host's firewall or attack-challenge mode, and Cloudflare in front if needed. The app's own limits stop cheap floods only ([Security](SECURITY.md#denial-of-service)) |
| **An admin account is compromised** | `update public.profiles set is_admin = false where id = '<id>';` in the SQL editor, and disable the user in Supabase Authentication |
| **A user lost their device** | If they have the backup file and passphrase they can link a new browser. Without it their old messages cannot be recovered: the "Start fresh" option makes a new key |
| **A user reports "security code changed"** | Their contact linked a new key ("Start fresh") or was attacked. Compare safety numbers out of band |

## Known unfinished areas

Kept honestly in [Roadmap](ROADMAP.md) and [Security](SECURITY.md#known-gaps). The important ones: no forward secrecy; devices share one account key; live behaviour was tested on an emulated Supabase, not a production project; presence is one shared channel; the content-security-policy still allows inline scripts.

## Where the history is

- `git log` (conventional commit messages) and [Changelog](CHANGELOG.md).
- [Decisions](DECISIONS.md): why things are built this way.
- [SECURITY_AUDIT.md](../SECURITY_AUDIT.md): the September 2026 security review, with the vulnerabilities found and how each was fixed and tested.
- [V1 status](V1_STATUS.md): the report from the original rebuild (a snapshot).
