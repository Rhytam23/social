# Testing

## Run everything

```bash
npx tsc --noEmit     # types
npm run lint         # ESLint
npm test             # Vitest
npm run build        # production build
```

Also run `npm audit`. Stop `npm run dev` before `npm run build` on Windows; a running dev server can make the build fail with `spawn UNKNOWN` or out-of-memory errors.

## Automated tests

Vitest runs in a Node environment (no browser, no jsdom). At the time of writing: **432 tests in 43 files** (the counts drift; what matters is that they all pass).

| File | Tests | What it covers |
|---|---|---|
| `tests/security/rls.test.ts` | 56 | **The project's real migrations `001` to `018` executed on an in-process Postgres (PGlite), then attacked with the API role as separate identities**: A and B (participants), C (outsider), an admin, and others. Unauthenticated access, reading and writing across users, forged senders, role and admin escalation, membership and group-key abuse, message and receipt tampering, blocking, storage, communities and invites, reports, avatar URLs, realtime policies. A second block runs the schema *before* `017` and shows the old vulnerabilities working, which proves each fix matters |
| `tests/security/apiSecurity.test.ts` | 22 | The real route handlers with a stub database: 401s, forged tokens, cross-conversation replies, admin route, injection-shaped ids, malformed and oversized bodies, type confusion, mass assignment, error leakage, per-account rate limits with spoofed headers, cross-site requests, upload file names |
| `tests/security/adminLogs.test.ts` | 17 | Migration `019` on real Postgres: only admins can read the error and audit logs; nobody (even an admin) can write, edit or delete them directly; ingest functions are not callable by signed-in users; de-duplication and reopening; admin actions refuse non-admins and write audit rows; 30-day retention and the 5,000-row cap |
| `tests/security/logIngest.test.ts` | 13 | `POST /api/logs/client`: 401, cross-site 403, oversized 413, malformed 400, per-account rate limit, the user comes from the session; server errors are logged with the user while the client gets a generic message |
| `tests/security/latestMessages.test.ts` | 4 | Migration `020` on real Postgres: exactly the newest message per conversation, never one from a conversation the caller is not in, empty input, signed-out refused |
| `tests/security/latestRoute.test.ts` | 5 | `GET /api/messages/latest`: 401, uses only the caller's own conversations, only known columns returned, 501 fallback while `020` is missing, no database text in errors |
| `tests/security/moderation.test.ts` | 24 | Migration `024` on real Postgres: who may report whom, the 3, 10 and 20 tiers counted by different reporters, the account-age rule, dismissed reports, the ban (auth ban set, sessions ended, email and addresses blocked), the sign-up hook, admins never auto-banned, admin ban, undo and unblock, audit trail, tables closed to clients, address retention |
| `tests/security/sessionSeenRoute.test.ts` | 8 | `POST /api/session/seen`: session required, the real address only, malformed and unknown addresses ignored, never fails the session, limited per account |
| `tests/security/hiddenAdmins.test.ts` | 10 | Migration `023` on real Postgres: a stranger cannot list, look up or fetch an admin, ordinary profiles are unchanged, the admin appears to people who share a chat or community and disappears when they leave, anonymous visitors see nothing, `is_admin()` does not recurse |
| `tests/security/adminChatAudit.test.ts` | 3 | A chat started by a platform admin is written to the activity log; ordinary chats and groups are not |
| `tests/security/adminRoles.test.ts` | 21 | Migration `025` on real Postgres: nobody, not even the service role, can change `is_admin` through the API, dashboard changes work and are logged, group admins have no platform powers, group and community role rules (admins only make members admins), the 10-channel limit, reserved official-looking names (and sign-up not failing for them) |
| `tests/security/supportRequests.test.ts` | 7 | Migration `022` on real Postgres: only admins read requests, nobody writes directly, submitting is server-only, per-email daily limit, 90-day retention, admin resolve is audited and non-admins are refused |
| `tests/security/supportRoute.test.ts` | 9 | `POST /api/support`: signed-out and signed-in requests, honeypot, cross-site, oversized and malformed bodies, validation (including header-injection-shaped emails), control characters, rate limit, no database text in errors |
| `tests/security/floodAndDevices.test.ts` | 8 | Migration `018` on real Postgres: the 3-key cap, per-account write limits, server writes not limited |
| `tests/security/deviceLinking.test.ts` | 6 | A new browser links instead of creating a key; failed checks refuse to continue; restore gives the same key; wrong passphrase and empty backup refused. Uses a stubbed database |
| `tests/security/authorization.test.ts` | 16 | Static checks of the SQL text of early migrations (`001`, `003`, `004`) |
| `tests/security/adversarial.test.ts` | 9 | Non-members, role escalation, attachment tamper detection, rate limiter, script/HTML payloads stored as plain text, backup brute force |
| `tests/crypto/e2ee.test.ts` | 14 | Key generation, 1:1 encryption both directions, wrong keys and tampering, group encryption with rotation, attachments, key backup and restore, safety numbers |
| `tests/integration/apiRoutes.test.ts` | 6 | Every data route returns `401` when signed out |
| `tests/integration/userSearch.test.ts` | 14 | Username-only lookup rules |
| `tests/chat/chatStore.test.ts`, `envelopeDisplay.test.ts` | 8 + 8 | The store in demo mode; how message payloads become text |
| `tests/ui/*.test.ts` | 108 | Preferences, rich text, group roles, notification rules, invites, app lock, ICE/TURN configuration, username validation, the moderation levels and that they match the migration (`moderation.test.ts`), the site address and its production fallback (`site.test.ts`), when the 3D hero may run (`capability.test.ts`: computers only), the bot-check switch, the support helpers, that the default theme follows the device and the sign-in hint used by the landing page, that technical error detail is shown only to admins (`errorVisibility.test.ts`), the error-log scrubber, fingerprints, browser throttling and admin list filters (`errorLogging.test.ts`), and that analytics only ever receives the origin and path (`analytics.test.ts`) |

`tests/security/pgHarness.ts` is the test database: it creates the Supabase roles (`anon`, `authenticated`, `service_role`), `auth.uid()` and the storage and realtime tables the migrations expect, then runs every migration. **When Supabase changes how any of those work, this file is where to update the emulation.**

### What the automated tests do not cover

- Anything against a real Supabase project: signup and email confirmation, Google sign-in, real Realtime delivery, real Storage, the exact behaviour of Supabase's own auth and realtime services. RLS is tested on real Postgres, but with an *emulated* Supabase around it.
- The UI in a real browser (there is no component or end-to-end test setup yet).
- Linking a second device with two real browsers.
- Real denial-of-service traffic. Only small flood checks were run (see [Security](SECURITY.md#denial-of-service)).

Those need the manual checklist below.

## Manual checklist

Use a real Supabase project ([Setup](SETUP.md)) and two browser profiles (or one normal and one private window), called **A** and **B**. Add a third account **C** for the isolation checks. Record the date and result of every run; do not mark an item as passed unless you saw it happen.

### Accounts
- [ ] A signs up with email and password. Weak or mismatched passwords show inline errors
- [ ] "Check your email" appears; resend works (after the cooldown)
- [ ] Signing in before confirming shows the confirmation prompt, not a generic error
- [ ] The confirmation link signs A in; A completes onboarding
- [ ] The **first** account created is an admin; later ones are not
- [ ] Sign out and sign in again
- [ ] Password reset email arrives and the new password works
- [ ] **Continue with Google** works for a fresh Google account, with the right name and photo
- [ ] Two accounts whose emails share a local part (`sam@a.com`, `sam@b.com`) can both sign up

### Messaging
- [ ] A finds B and starts a direct chat
- [ ] Messages arrive on the other side **without refreshing**, in both directions
- [ ] After a refresh, history is still there and readable
- [ ] Edit and delete on A appear live on B
- [ ] A reply, a reaction and a forwarded message work
- [ ] Turn the server off or block the request: the message shows `failed` with a working retry, never `delivered`
- [ ] In the Supabase table editor, `messages.ciphertext` is unreadable text and no column contains the message

### Files and voice
- [ ] Send an image and a document; the recipient can download and open them
- [ ] An image over 10 MB, a video over 100 MB (or over the ceiling you set) and any other file over 25 MB are each refused with a clear message before anything uploads
- [ ] A 5 MB image, a 20 MB video and a 20 MB PDF upload, send and open for the other person (with migration `021` applied)
- [ ] After `021`, a direct upload to the bucket with the Supabase client and your own session is refused
- [ ] Uploading more than about 500 MB in a day is refused with the daily limit message; starting more than 6 uploads in a minute is slowed down
- [ ] Record and send a voice note; it plays with a correct duration
- [ ] In Storage, the uploaded object is unreadable bytes

### Groups
- [ ] A creates a group with B; both can send and read
- [ ] Add a third member: they can read new messages, not earlier ones
- [ ] Remove a member: they cannot read anything sent afterwards

### Isolation (account C is not in A and B's conversation)
- [ ] C cannot see the conversation or its messages in the app
- [ ] `GET /api/messages?conversationId=<A-B chat>` as C returns `403`
- [ ] Querying `messages` directly with C's session returns no rows
- [ ] C cannot download A and B's attachments
- [ ] C cannot promote themselves to admin

### Keys and settings
- [ ] Export a key backup; restore it in another browser with the passphrase and read old messages
- [ ] A wrong passphrase is rejected
- [ ] Upload a profile photo
- [ ] Safety numbers show the same value on both sides

### Layout
- [ ] All screens work at 390px wide and at desktop width; the landing page and sign-up form scroll fully

### Production build
- [ ] With a Supabase variable removed, a production build returns `500 Server misconfiguration`

## Checklist for the platform release (migrations 011 to 016)

Nothing below has been run against a live project yet. Use two or three test accounts (A, B, C) in separate browser profiles.

**Migration checks**
- [ ] After `011`: as B, run `select email, phone_number from profiles` in the API or console: it must fail with a permission error. Sign-in and Settings still work. Finding A by exact `@username` works; searching A's name, email or phone number, or part of the username, finds nothing.
- [ ] After `016`: `select find_profiles_by_contact('a@example.com')` as B fails with a permission error.
- [ ] People: search a username that exists (any capitalisation, with or without `@`) and press Message; search a username that does not exist and see the no-results message; search an empty value, a name with a space and an email and see the validation message. Block A, search A again: the card says you blocked them and Message is disabled.
- [ ] Groups `+` in the left rail: create a group with a member found by username; paste an invite link and join (needs 014); a wrong code shows an error. Chat (lock) shows only direct chats; Groups shows only groups.
- [ ] Settings button (lower left): Profile is the first section; each of Profile, Account, Privacy, Security, Appearance, Notifications, Devices, Data, About opens; on a phone the list opens first and Back returns to it.
- [ ] After `013` to `015`: existing groups show their creator as owner; a plain member cannot add people or change a role (try `update conversation_members set role = 'admin'` as that member: it must fail).

**Chat**
- [ ] React with an emoji as A; B sees it live; both still see it after a refresh.
- [ ] A sends a message; B reads it; A's tick turns to "read". Turn off read receipts on B: A stays on "delivered".
- [ ] Unread badges survive a refresh and clear when the chat is opened in another tab.
- [ ] Set B to Do Not Disturb: A sees the red dot. Leave B idle for 5 minutes: B shows Away.
- [ ] A types: B sees "is typing". Turn typing indicators off on A: B sees nothing.
- [ ] Star a message: it appears under Saved after a refresh; only the id is in `saved_messages`.
- [ ] A message with **bold**, code in backticks and a link renders formatted; a message containing an HTML tag (for example an image with an onerror handler) renders as plain text.

**Groups and threads**
- [ ] As owner, promote B to admin; B can add C; C (member) cannot see "Add member" and the API refuses.
- [ ] Turn on "Only admins can post": C cannot post; try inserting directly with the API, it must be refused.
- [ ] Remove C: C's chat disappears, and a message B sends afterwards cannot be read by C (key rotated).
- [ ] Owner leaves: ownership moves to the longest-serving admin.
- [ ] Reply in a thread as B: A sees "1 reply" under the parent, and the reply is not in the main stream.

**Notifications**
- [ ] Mute a chat for 1 hour: no alert, badge still counts. Mentions only: only `@name` and DMs alert. Quiet hours and Do Not Disturb silence alerts.
- [ ] Hide the tab: a desktop notification appears; its body is "New message" if previews are off.

**Communities**
- [ ] A creates a community, adds a private channel with B only; C joins by invite link and cannot see the private channel.
- [ ] After C joins, A's app (open) shares the channel keys: C can read new messages in #general.
- [ ] Removing C rotates the key of the channels C was in.

**Privacy**
- [ ] Set disappearing messages to 24 hours: a new message shows an expiry (`messages.expires_at` is set by the database). To test quickly, set `expires_at` in the past in SQL: the message vanishes for both sides within a minute.
- [ ] B blocks A: A's send to B is refused; B's send still works; A's app does not say why.
- [ ] Report a message with and without "include the text"; as admin, see it under Admin.
- [ ] App lock: set a PIN, reload: the lock screen appears; five wrong PINs force a 30 second wait.
- [ ] Change B's device (new browser, no key backup): A sees the "security code changed" banner.

**Calls** (two devices, ideally on different networks)
- [ ] A voice call: ring, accept, audio both ways, mute, hang up; a "Voice call" entry appears once in the chat.
- [ ] A video call with camera off/on. Decline and let it ring out: "Declined" and "Missed" entries.
- [ ] With B on Do Not Disturb, A's call is declined quietly. Deny microphone permission: a clear message appears.
- [ ] Across strict networks with no TURN configured, a "may not connect" note is shown; with `TURN_URLS` set it connects.

## Checklist for the security and multi-device release (migrations 017 and 018)

Run after applying `017` and `018` to a real project. Use accounts A, B, C (outsider).

- [ ] Typing indicator: A types, B sees it. Start a call, it rings. (If not, Realtime Authorization is misconfigured, see [Setup](SETUP.md#6-verify-the-storage-buckets-and-realtime).)
- [ ] Blocking: B blocks A, then A tries to send to B: refused. B can still send to A.
- [ ] Group keys: in a group where B is only a member, B cannot add a key for C (the API refuses); the owner can add C and C can read new messages.
- [ ] Sign in as A on a second browser with no key: the **Link this device** screen appears (no new key is created). Link with the backup file and passphrase; old and new messages are readable on both browsers, and a message sent from either arrives on the other. A wrong passphrase is refused.
- [ ] On the second browser choose **Start fresh** with a spare account: old messages become unreadable and the contact sees "security code changed".
- [ ] Check `select count(*) from user_devices where user_id = '<A>'` is 1 after linking, not 2.
- [ ] Try to insert a 4th `user_devices` row for A (SQL as A): refused with `device_limit_reached`.
- [ ] Send more than 120 messages in a minute with a script: the extra are refused.
- [ ] Response headers on the live site include `Content-Security-Policy` and `Strict-Transport-Security`; `/api/users` has `Cache-Control: no-store`.
- [ ] Errors: as an ordinary user, cause a failure (for example save a profile before migration `011` is applied, or block the network) and confirm the message is a plain sentence with no database or migration text; as an admin the same failure also shows an "Admin detail" part.
- [ ] Theme: with no saved choice, a light-mode device shows the light theme and a dark-mode device the dark theme, and switching the device setting changes the app without reloading. Choosing Dark or Light in Settings sticks.

## Checklist for the admin error log (migration 019)

Run after applying `019`. Use an admin account and an ordinary account.

- [ ] As the admin, Admin, Errors and Activity open without an error note (if you see "not available", `019` is missing).
- [ ] As an ordinary user cause a failure (for example turn off the network and send a message, or save a profile before `011` is applied). Within a minute the admin sees it under Errors, marked Browser, with the user's name and no message text, keys or email addresses.
- [ ] Repeat the same failure: the row's count goes up and no second row appears.
- [ ] Mark it resolved, then cause it again: it reopens. Activity shows who resolved it.
- [ ] Promote another account to admin: Activity shows who did it. That new admin can read Errors without any Supabase access.
- [ ] As the ordinary user, open the Admin area (or query `error_logs` with the API): nothing is returned.
- [ ] Clear resolved removes only resolved entries and is recorded in Activity.
- [ ] Force a server error (for example upload with the Storage bucket missing) and confirm it appears as Server.

## Not yet done

- A CI workflow that runs the four commands above on every pull request.
- Browser end-to-end tests (Playwright) for the journeys above.
- Row level security tests against a real Supabase project (pgTAP or the Supabase CLI). RLS is currently tested on an in-process Postgres with an emulated Supabase (`tests/security/rls.test.ts`).

## Checklist for the public pages, support and the bot check

Run after applying `022`.

- [ ] Signed out: Home, Features, Security, Help, Contact, Privacy and Terms all load, show the header and footer, and the header tab of the current page is highlighted. On a phone the menu opens without JavaScript.
- [ ] Signed in: the app shows no site header or footer anywhere.
- [ ] Contact form: a message with a valid email sends and shows the confirmation; a missing email or a message under 10 characters is refused with a clear note; sending more than 5 in a day from one email is refused.
- [ ] Admin, Support lists the message with its topic, email and time; Reply by email opens a mail to that address; Mark resolved and Reopen work and appear in Admin, Activity.
- [ ] Settings, About, Report a problem sends as the signed-in account (no email field) and appears in Admin, Support with the account.
- [ ] Landing on a computer: the 3D scene appears after the page loads; with the operating system's reduced-motion setting on, or on a phone or tablet, it never loads and the page is plain.
- [ ] With `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set and CAPTCHA enabled in Supabase: sign-up, sign-in and reset show the check and refuse to submit until it passes; a wrong password can be retried (the check refreshes).

## Checklist for admin roles (migration 025)

- [ ] Admin, People shows everyone read-only with no promote or demote buttons, and the verified badge next to platform admins only.
- [ ] In the Supabase table editor, ticking `is_admin` for a test account makes the Admin section appear for them after a reload, and the change shows in Admin, Activity. Unticking it removes access. (This also confirms the dashboard connection is allowed, which the automated tests can only emulate.)
- [ ] In the browser console, `supabase.from('profiles').update({ is_admin: true })` for your own row does nothing.
- [ ] A group admin can make a member an admin, cannot demote the other admin or the owner, and never sees the Admin section.
- [ ] A community admin can create channels until the community has 10 (the default one counts), then sees a clear message.
- [ ] Renaming an ordinary account to "Nook Admin" or a name with a check mark is refused with a clear message; the platform admin can use any name.

## Checklist for hidden platform admins (migration 023)

- [ ] As an ordinary account that has never talked to the admin, search the admin's exact username: no result. In the browser console, `supabase.from('profiles').select('*')` does not include the admin.
- [ ] As the admin, start a chat with that account: it appears for them, with the verified badge on the admin's name. A third account that has not talked to the admin still cannot find them.
- [ ] Community members can see the admin's name in the member list; someone outside the community cannot.
- [ ] Community lists, group member lists, mentions and onboarding still show everyone else correctly (this is the change most likely to break something: check it on a staging project first).
- [ ] The admin's start of a chat appears in Admin, Activity as `admin_start_chat`.

## Checklist for reports and bans (migration 024)

Use throwaway accounts older than a day. Nothing below has been run against a live Supabase project.

- [ ] Report a message from a chat you share; a report about someone you do not share a chat with is refused.
- [ ] With 3 different accounts reporting one account, that account sees the warning once after its next sign-in, and it is gone after "I understand". It does not say who reported.
- [ ] With 10 different accounts, the account is suspended: it cannot sign in ("This account is suspended"), existing sessions end, and Admin, Safety queue shows it with the ban date. Lift ban lets it sign in again.
- [ ] After a suspension, signing up with the same email is refused (needs the Before User Created hook, see Setup). Confirm whether signing up from the same network is also refused; if not, address blocking is not working on your Supabase version.
- [ ] Above 10 the person is shown in red; at 20 they are blocked permanently.
- [ ] A shared address shows "shared: N accounts" and Unblock removes it.
- [ ] A platform admin reported by many accounts is not banned.
- [ ] Every step appears in Admin, Activity.
