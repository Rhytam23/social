# Security

What the app protects, what it deliberately does not, the rules contributors must keep, and the gaps we know about. It is an honest account, not a certification: the system has not had an independent audit. The most recent internal review (September 2026) and its findings are in [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md); this page is the standing description.

**Nothing here means the application is "completely secure".** It means these specific controls exist, and the tests named below check them.

## Threat model

| Adversary | Protection |
|---|---|
| Someone with **database or storage access** (a leaked backup, a Supabase admin) | Message text, attachment contents, file names and types are ciphertext. They can see conversation membership, timestamps and sizes |
| **Another signed-in user** trying to read or change conversations they are not in | Row level security on every table; explicit membership checks in the API; private storage buckets. Tested on a real Postgres ([Testing](TESTING.md)) |
| **A malicious member** of a conversation | Cannot forge senders, rewrite message metadata, plant group keys, promote themselves, or (once blocked) message the person who blocked them |
| **A passive network attacker** | HTTPS with HSTS |
| **An anonymous internet user** | Auth required for all data routes; rate limits; email confirmation on signup |
| **Someone flooding the service** | Per-address and per-account rate limits, body-size caps, database write limits. Not a defence against a volumetric DDoS: see [Denial of service](#denial-of-service) |
| **A malicious or compromised server** | Cannot read past or current messages. Could substitute public keys to intercept *new* messages ([E2EE](E2EE.md#limitations)); safety numbers detect it |
| **Malware or a hostile browser extension on your device** | Not protected against |
| **Someone who steals a linked device or the backup file and passphrase** | Gets the account key: can read everything exchanged that was captured as ciphertext (no forward secrecy) |

## Controls in place

**Data and access**
- **Zero plaintext storage.** `messages` has no content column. Everything about a message, including attachment metadata, is inside the encrypted envelope.
- **Row level security on every table**, with helper functions that fix their `search_path` ([Database](DATABASE.md#row-level-security-summary)). Policies that query other tables use `SECURITY DEFINER` helpers where the caller would otherwise be filtered out (the cause of the blocking bug, see the audit).
- **Integrity triggers.** After insert, a message's conversation, sender, reply target and timestamps cannot be changed; membership rows cannot be moved; receipts cannot be re-pointed.
- **Group key envelopes can only be created by a group owner or admin**, for an active member's registered key.
- **Blocking is enforced by the database**, not the interface.
- **Reports, warnings and bans.** Reports are only accepted about someone you share a conversation with. Each *different* reporter counts once (90 days, dismissed reports and accounts under 24 hours old excluded): 3 gives a warning, 10 a 7-day ban, 20 a permanent block; platform admins are never banned automatically, every action is audited, and admins can undo any of them. A ban sets `auth.users.banned_until` (Supabase Auth refuses sign-in and refresh) and ends sessions; the email and the recorded network addresses are blocked from creating new accounts via the Before User Created hook. Network addresses (`user_ips`) are personal data: 20 per account, 180 days, platform admins only, named in the privacy policy. Limits: brigading with many real aged accounts is possible (mitigated by counting different people, the age rule and admin undo, not eliminated); shared addresses can block innocent people (the admin screen shows how many accounts used an address); a determined person changes network or email. There is **no admin access to anyone's messages**: they are end-to-end encrypted, and evidence for moderation is the reports and the excerpts reporters choose to include.
- **Platform admins cannot be found.** Since `023` the `profiles` read rule hides a platform admin from everyone except themselves, other admins, and people who share a conversation or community with them, whether they search by username, list the table or join to it. "Not findable" means not discoverable, not anonymous: anyone the admin talks to knows who they are. The admin's user id can still appear in the live presence list (without a name); use the "Appear offline" status to avoid that. Admin-started chats are written to the activity log (`admin_start_chat`). Blocks still apply to admins.
- **Platform admin is made only in Supabase.** Since `025` no API role, not even the service role, can change `profiles.is_admin`; the in-app promote button and route were removed. A stolen admin session, an XSS bug or a leaked service-role key therefore cannot create admins. Group and community admins are a separate, weaker role (they can promote members and create up to 10 channels) with no platform powers. The verified badge is drawn only from `is_admin`, and names that look official are reserved for platform admins (`guard_profile_names`). Limits: the dashboard itself is protected only by your Supabase account (use its multi-factor sign-in).
- **Admin is a database fact.** `profiles.is_admin` is the only source, checked server side (`lib/auth/roles.ts`, `middleware.ts`). A trigger stops signed-in users setting it. **The first account created on a fresh install becomes admin**: sign up as yourself first.
- **The service-role key is server only**, used only in `lib/supabase/admin.ts` for admin role changes. It is not a `NEXT_PUBLIC_` variable and is absent from the client bundle (checked).
- **People are found by exact username only** (`/api/users?username=`); email and phone are never returned and are hidden by column privileges (`011`, `016`). **Limit:** any signed-in user can still read the non-private `profiles` columns (username, display name, photo, bio) with the Supabase API, so username-only lookup is enforced by the app, not by RLS.
- **Private conversations are capped at two members** by a trigger.
- **Bot check.** Sign-in, sign-up and password reset go straight from the browser to Supabase Auth, so this app cannot rate-limit them itself. An optional Cloudflare Turnstile check (`lib/captcha.ts`, enabled by `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and by CAPTCHA protection in Supabase) keeps automated floods out; the sign-in, sign-up, reset and email-link pages also have a tighter per-address limit in middleware. It adds Cloudflare to the Content-Security-Policy only when switched on.
- **Support inbox.** `POST /api/support` accepts messages without an account, so it is bounded: cross-site guard, 8 KB body, 5 requests per 10 minutes per address, a honeypot, control characters stripped, and at most 5 requests a day per email in the database (`022`). Requests are readable only by platform admins and are deleted after 90 days.
- **Storage.** Encrypted uploads into a private bucket, `application/octet-stream` and the ceiling enforced by the bucket itself, path scoped to the conversation, random file names. Since `021` clients cannot write to the bucket directly: uploads need a signed address from `/api/uploads/sign`, which enforces membership, size per kind (image 10 MB, video 100 MB, other 25 MB), rate and a 500 MB daily quota, and `/api/uploads/complete` deletes anything whose real size is over its limit. Because files are encrypted the server cannot see the kind, so a dishonest client can use the deployment ceiling (`NEXT_PUBLIC_STORAGE_MAX_FILE_MB`); the ceiling and the quota are the real cost bound.
- **Profile photo URLs** must be the project's avatars bucket or Google's image host.

**Requests**
- **Every API route** authenticates, validates ids (UUID), caps body sizes, rate limits per address and per account, refuses cross-site state-changing requests (Origin check), returns generic errors, and sends `Cache-Control: no-store`. The helpers are in `lib/api/security.ts`; a new route must use them.
- **Fail closed.** In production a missing or placeholder Supabase configuration returns HTTP 500. Demo mode exists only when `NODE_ENV` is not `production`.
- **Open-redirect protection** on `/auth/confirm`: `next` must be a same-site path.
- **Errors shown on the login page are length-capped and rendered as plain text.**
- **Technical error detail is for admins only.** People see a short friendly message; platform admins also see the technical detail (database messages, migration hints, decrypt reasons) after it. Implemented in `lib/ui/errors.ts` (`userError`, `technicalNote`, `adminDetail`, `UserMessageError`); the viewer's admin status is set at sign-in from `profiles.is_admin`. **This is a display rule, not an access control:** calls the browser makes straight to Supabase carry the database's own message, which someone inspecting the network tab can still read. The real protection is the database rules; the API routes already return only generic errors.

**Admin error and activity log** (`019`)
- Admins can see server and browser errors and what other admins did inside the app (Admin, Errors and Activity), so 3 or 4 admins do not need Supabase or hosting access. Readable by **admins only, enforced by row level security**; clients cannot write to the tables at all (ingest is by server-only functions), and the audit log is append-only.
- **What is never recorded:** message content, keys, tokens, passwords, email addresses, request bodies. Text is scrubbed (`lib/logging/scrub.ts`), length-capped, and shown as plain text. Entries are kept 30 days and the table is capped at 5,000 rows.
- The browser reporting route is authenticated, rate limited and size limited, and the affected user comes from the session, never from the request body.

**Analytics** (`components/analytics/WebAnalytics.tsx`)
- Vercel Web Analytics counts page views. Production builds only; cookieless; the address is reduced to origin and path before it is sent (`lib/analytics.ts`), so invite links (`?join=CODE`) and sign-in parameters never leave the browser. It is served from this site's own `/_vercel/insights/` path, so the Content-Security-Policy needs no extra origin. The privacy policy page says so.

**Browser hardening** (`next.config.ts`)
- **Content-Security-Policy**: scripts, styles, images, fonts, connections and frames limited to this site and the Supabase project; `frame-ancestors 'none'`; `object-src 'none'`; `upgrade-insecure-requests` in production.
- HSTS (2 years, preload), `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` `same-origin`, `X-Content-Type-Options`, `Referrer-Policy`, a restrictive `Permissions-Policy` (camera and microphone for this site only), no `X-Powered-By`.
- Message formatting is parsed into a data tree and rendered as React elements, never HTML; only `http(s)` links are recognised.

**Realtime**
- Typing and call-signalling channels are **private** with policies on `realtime.messages` (`017`). Call signalling payloads are additionally end-to-end encrypted; TURN credentials are short-lived.

**Devices**
- At most 3 registered keys per account (`018`); a browser without a key on an account that already has one must link with the backup instead of silently creating a new key ([E2EE](E2EE.md#keys-and-linking-devices)).

## Denial of service

Layers, from the outside in. Only the last two are in this repository; the rest are settings you must apply.

1. **A network firewall in front of the app** (Vercel Firewall or attack-challenge mode, or Cloudflare). This is the only defence against a volumetric flood that saturates bandwidth. **The app cannot provide it.** Turn it on for a public deployment.
2. **Supabase's own limits** for sign-up, sign-in, password reset and email: set them in Supabase → Authentication → Rate Limits, and use custom SMTP. Add a CAPTCHA (for example Cloudflare Turnstile) to sign-up if you get bot accounts; it needs keys from you and is not built in.
3. **`middleware.ts`**: a per-address limit before any Supabase call (300 requests a minute for `/api` and `/auth`, 600 for pages), so junk traffic never costs an authentication lookup, and a 2 MB body cap on `/api`.
4. **Per-route and per-account limits** in `app/api/*` (`lib/api/security.ts`). Keyed on the platform's trusted client-address header, and on the account, so changing a header does not help.
5. **Database write limits** (`018`): 120 messages and 200 reactions a minute and 30 new conversations an hour per account, enforced by triggers so they also stop someone who calls Supabase directly.

Weak points: in-memory limits are per server instance (on serverless they are weaker than they look) unless Upstash Redis is configured; the server cannot see how many uploads are still running, so it limits how fast they can start; sign-up is limited by Supabase, not by this code.

## Rules for contributors

1. **No plaintext message content on the server**: no `content` column, no logging of decrypted text, no plaintext fallback.
2. **Never expose the service-role key.** No `NEXT_PUBLIC_` prefix, no client imports.
3. **Derive admin from `profiles.is_admin`**, never from JWT `app_metadata` or client input.
4. **No `USING (true)` policies** on tables holding private data without a written reason, and no policy that lets users grant themselves access. Remember a policy that reads another table is filtered by that table's RLS.
5. **Do not delete or weaken security tests** to make a change pass. `tests/security/rls.test.ts` runs the real migrations: if it fails, a database rule no longer holds.
6. **Do not fake success.** Never mark a message delivered when the server rejected it, or show a "saved/backed up" message that did nothing.
7. **Add new environment variables to `.env.example`**, and document whether they are secret. Never commit `.env*` (only `.env.example`).
8. **No advertising or tracking scripts, and no analytics beyond Vercel Web Analytics** (anonymous page-view counts, no cookies, production only). It may only ever receive the origin and path: query strings and fragments (invite codes, sign-in redirects) are stripped in `lib/analytics.ts`. Do not add another third-party script, and do not send anything from inside the app (a chat, a person, a group) to any analytics service.
9. **Schema changes go through a new migration**, with matching updates to `types/database.ts` and tests.
10. **New API routes use `lib/api/security.ts`** (auth, validation, limits, origin check, generic errors) and get a test in `tests/security/apiSecurity.test.ts`.
11. **Never put secrets, keys or private data in URLs, logs or client storage used as a security control.**
13. **Never write message content, keys, tokens, passwords or request bodies to the error log or to `console`.** Log through `serverError()` (server) or `userError()`/`reportClientError()` (browser); they scrub and cap the text.
12. **Never show a raw exception, database or migration message to a user.** Wrap it: `userError(err, 'Friendly sentence.')`, `technicalNote(detail, generic)` or `adminDetail(err, fallback)` from `lib/ui/errors.ts`. Throw `UserMessageError` only for messages written for people (for example "Use 4 to 8 digits").

## Known gaps

Ordered roughly by importance. Also tracked in the [Roadmap](ROADMAP.md).

1. **No forward secrecy.** A stolen account key exposes every captured message ([E2EE](E2EE.md#limitations)).
2. **Linked devices share one key.** Losing any device exposes the account; "revoke device" cannot take the key back.
3. **The key is unencrypted in the browser's IndexedDB.** A script-injection bug would expose it. The CSP reduces this but still allows inline scripts (framework requirement). The app lock is only a screen lock.
4. **Presence is one shared channel** (`pc-presence`): any signed-in user can see who is online and their status.
5. **The first account becomes platform admin.** Check `profiles.is_admin` after installing.
6. **Profile columns are readable by any signed-in user** (username, display name, photo, bio); username-only search is an application rule.
7. **A group admin's device must be online** to share group keys with a new member or a new community member.
8. **In-memory rate limits are per instance** without Upstash; the number of uploads in progress is bounded by the start rate, not counted.
9. **Security headers are not present on middleware redirects** and the production misconfiguration 500, because those responses are built separately.
10. **No audit log** of admin actions beyond a server log line.
11. **No CI**: nothing forces the checks to run before a merge.
12. **Argon2id and key generation run on the main thread** and can briefly freeze the interface.
13. **The error log accepts reports from any signed-in user.** A malicious user could send junk entries; this is bounded by the per-account rate limit, the once-a-minute de-duplication and the 5,000-row cap, but it can push real entries out. Browser errors that happen before sign-in are not captured (server errors always are).
14. **Live Supabase behaviour is unverified by automated tests.** RLS is tested on real Postgres with an emulated Supabase, not on a Supabase project. Use the [manual checklist](TESTING.md#manual-checklist).

**Fixed and kept here so nobody reintroduces them:** blocking that did nothing; any member planting group keys; a creator re-adding themselves as owner; rewriting message columns; rate limits keyed on a spoofable header; no CSP; open realtime channels; unrestricted avatar URLs; missing storage limits; database error text returned to clients; vulnerable `postcss` and `vitest`; a second browser silently replacing the account key. Details and tests are in [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md).

## Secrets

If a secret is ever committed, rotate it at the source. Removing it from the working tree does not remove it from git history. In September 2026 a database connection string and `JWT_SECRET` from an earlier project were found in the history of this public repository; the required rotations are listed in `SECURITY_AUDIT.md` section 6.

## Reporting a problem

Open a private security advisory on the GitHub repository, or contact the maintainer directly. Please do not post details of an unfixed vulnerability in a public issue.
