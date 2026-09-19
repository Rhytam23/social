# Security

What the app protects, what it deliberately does not, the rules contributors must keep, and the gaps we know about. It is an honest account, not a certification: the system has not had an independent audit.

## Threat model

| Adversary | Protection |
|---|---|
| Someone with **database or storage access** (a leaked backup, a Supabase admin) | Message text, attachment contents, file names and types are ciphertext. They can see conversation membership, timestamps and sizes |
| **Another signed-in user** trying to read conversations they are not in | Row level security on every table; explicit membership checks in the API; private storage buckets |
| **A passive network attacker** | HTTPS with HSTS |
| **An anonymous internet user** | Auth required for all data routes; rate limiting; email confirmation on signup |
| **A malicious or compromised server** | Cannot read past or current messages. Could, however, substitute public keys to intercept *new* messages (see [E2EE](E2EE.md#limitations)); safety numbers are how to detect it |
| **Malware or a hostile browser extension on your device** | Not protected against |
| **Someone who steals your private key** | Can read everything you ever exchanged that was captured as ciphertext (no forward secrecy) |

## Controls in place

- **Zero plaintext storage.** `messages` has no content column. Everything about a message, including attachment metadata, is inside the encrypted envelope.
- **Row level security on all ten tables**, with helper functions that fix their `search_path` ([Database](DATABASE.md#row-level-security-summary)).
- **Admin is a database fact.** `profiles.is_admin` is the only source, checked server side (`lib/auth/roles.ts`, `middleware.ts`). A trigger stops signed-in users from setting it. The first account created becomes admin.
- **Service-role key is server only** and used only for admin role changes. It is never imported by browser code.
- **Fail closed.** In production a missing or placeholder Supabase configuration returns HTTP 500. Demo mode exists only when `NODE_ENV` is not `production`.
- **Signup requires a confirmed email** (with Supabase's Confirm email setting on) or a Google account.
- **Open-redirect protection** on `/auth/confirm`: `next` must be a same-site path.
- **Search hides private fields**: `/api/users` matches on email and phone but never returns them.
- **Private conversations are capped at two members** by a trigger.
- **Encrypted uploads** into a private bucket, 25 MB limit, path scoped to the conversation.
- **Rate limits** on every API route.
- **Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera and microphone for this site only), HSTS.
- **Errors surfaced to the login page are length-capped and rendered as plain text.** Only reasons from Supabase or the callback are shown.

## Rules for contributors

1. **No plaintext message content on the server**: no `content` column, no logging of decrypted text, no plaintext fallback.
2. **Never expose the service-role key.** No `NEXT_PUBLIC_` prefix, no client imports.
3. **Derive admin from `profiles.is_admin`**, never from JWT `app_metadata` or client input.
4. **No `USING (true)` policies** on tables holding private data without a written reason, and no policy that lets users grant themselves access.
5. **Do not delete or weaken security tests** to make a change pass.
6. **Do not fake success.** Never mark a message delivered when the server rejected it, or show a "saved/backed up" message that did nothing.
7. **Add new environment variables to `.env.example`**, and document whether they are secret.
8. **No analytics, advertising or tracking scripts.**
9. **Schema changes go through a new migration**, with matching updates to `types/database.ts` and tests.

## Added controls (unverified against a live project)

- Group roles with a database trigger so a member cannot promote themselves (`013`); owner-only role changes.
- Blocking enforced by the messages insert rule, not just the interface (`015`).
- Disappearing messages enforced by a trigger (`015`).
- App lock: PBKDF2-SHA256 (310,000 iterations, random salt) PIN check with backoff after five wrong attempts. It is a screen lock on one device and **does not encrypt the keys stored in the browser**.
- Call signalling encrypted end to end; TURN credentials short-lived.
- Message formatting is parsed into a data tree and rendered as React elements, never as HTML; only `http(s)` links are recognised.
- Security-relevant limitation of live features: the presence, typing and call-signal Realtime channels are readable by any signed-in client of the project (Realtime Authorization is not enabled). They carry ids and statuses, or encrypted payloads, never message text.

## Known gaps

Ordered roughly by importance. These are tracked in the [Roadmap](ROADMAP.md).

1. **(Fixed by migration `011`, not yet verified on a live project.)** ~~Profile email and phone are readable by any signed-in user.~~ Column privileges now hide them; **run `011` and confirm** with a second account that `select email from profiles` fails. Original description: **Profile email and phone are readable by any signed-in user.** The `profiles` table has a read policy of `USING (true)` for all authenticated users, and migration `005` added the `email` and `phone_number` columns without restricting them. The `/api/users` route hides them, but a signed-in user can query the Supabase API directly and read every profile's email and phone. This was identified by reading the policies and has not been tested against a live project. The fix is to move those columns into a private table (or restrict them with column privileges) and update the app.
2. **(Fixed in code, needs migration `013`.)** **`DELETE /api/groups/members` relied on row level security alone**, with no route-level authorization. RLS limits it to removing yourself or being a platform admin, but the route should verify this explicitly.
3. **The `conversation_members` insert rule lets a conversation's creator add any user id**, without that user's consent. Plain members can no longer add people to a group (`013`), but there is still no consent step for being added.
4. **Rate limiting is weak.** The limiter is fixed-window (not sliding), keyed on the `x-forwarded-for` header (spoofable unless your proxy overwrites it), and in memory per server instance unless Upstash is configured.
5. **No Content Security Policy.** A cross-site scripting bug would expose the key store in IndexedDB.
6. **No forward secrecy, no real multi-device support, key substitution risk**: see [E2EE limitations](E2EE.md#limitations).
7. **Argon2id and key generation run on the main thread** and can briefly freeze the interface.
8. **Security headers are not present on middleware redirects or the production misconfiguration 500**, because those responses are built separately.
9. **No audit log** of admin actions.
10. **No CI**: nothing forces the checks to run before a merge.

## Reporting a problem

Open a private security advisory on the GitHub repository, or contact the maintainer directly. Please do not post details of an unfixed vulnerability in a public issue.
