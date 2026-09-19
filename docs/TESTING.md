# Testing

## Run everything

```bash
npx tsc --noEmit     # types
npm run lint         # ESLint
npm test             # Vitest
npm run build        # production build
```

Stop `npm run dev` before `npm run build` on Windows; a running dev server can make the build fail with `spawn UNKNOWN` or out-of-memory errors.

## Automated tests

Vitest runs in a Node environment (no browser, no jsdom). 111 tests in 13 files:

| File | Tests | What it covers |
|---|---|---|
| `tests/crypto/e2ee.test.ts` | 14 | Key generation and persistence, 1:1 encryption in both directions (including reading your own sent message), wrong-recipient key rejection, tampered ciphertext and nonce, private keys never in exported bundles, per-device keys, group encryption with key rotation on member removal, attachment encryption, key backup and restore with wrong passphrases, stable order-independent safety numbers |
| `tests/security/adversarial.test.ts` | 11 | Non-members cannot read or post in other people's chats or edit their messages, role escalation rejected, `isUserAdmin` false for bad ids, attachment encryption and tamper detection, rate limiter throttling, script/HTML payloads stored as plain text, key backup brute force |
| `tests/security/authorization.test.ts` | 16 | Static analysis of the SQL migrations (`001`, `003`, `004`): group roles gone, `is_admin()` reads only `profiles.is_admin`, escalation blocked, no `USING (true)` in the `003` policies, device and presence visibility scoped, no plaintext or private-key columns, storage isolation |
| `tests/integration/apiRoutes.test.ts` | 9 | Every data route returns `401` when signed out |
| `tests/chat/chatStore.test.ts` | 8 | The message store in demo mode: defaults, optimistic send, reactions, edit, delete, creating direct and group conversations without duplicates, switching persona |
| `tests/chat/envelopeDisplay.test.ts` | 8 | How message payloads become text and previews, including unknown future kinds and hidden poll votes |
| `tests/ui/preferences.test.ts` | 8 | Merging saved settings over defaults, quiet hours across midnight, username validation |
| `tests/ui/richText.test.ts` | 8 | Message formatting: bold, italic, code, quotes, fenced blocks, safe links only, no HTML from text |
| `tests/ui/groupRoles.test.ts` | 7 | Who can add, remove and promote in a group, and who inherits ownership |
| `tests/ui/notificationRules.test.ts` | 9 | When a message alerts (do not disturb, mute, mentions-only, overrides) and @mention detection |
| `tests/ui/invite.test.ts` | 3 | Reading an invite code from a link |
| `tests/ui/appLock.test.ts` | 6 | PIN hashing, wrong-PIN rejection, salting, backoff after repeated failures |
| `tests/ui/iceConfig.test.ts` | 6 | STUN and TURN configuration, short-lived credentials, secrets never returned |

### What the automated tests do not cover

- Anything against a real Supabase project: signup and email confirmation, Google sign-in, **live row level security**, Realtime delivery, storage.
- The UI in a real browser (there is no component or end-to-end test setup yet).
- Migrations executing against Postgres (the SQL tests read the files; they do not run them).

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
- [ ] A file over 25 MB is refused with a clear message
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

## Checklist for the platform release (migrations 011 to 015)

Nothing below has been run against a live project yet. Use two or three test accounts (A, B, C) in separate browser profiles.

**Migration checks**
- [ ] After `011`: as B, run `select email, phone_number from profiles` in the API or console: it must fail with a permission error. Sign-in, Settings and finding people by name still work; finding A by exact email works, partial email does not.
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

## Not yet done

- A CI workflow that runs the four commands above on every pull request.
- Browser end-to-end tests (Playwright) for the journeys above.
- Live database tests (pgTAP or the Supabase CLI) for row level security.
