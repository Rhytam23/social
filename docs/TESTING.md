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

Vitest runs in a Node environment (no browser, no jsdom). 64 tests in 6 files:

| File | Tests | What it covers |
|---|---|---|
| `tests/crypto/e2ee.test.ts` | 14 | Key generation and persistence, 1:1 encryption in both directions (including reading your own sent message), wrong-recipient key rejection, tampered ciphertext and nonce, private keys never in exported bundles, per-device keys, group encryption with key rotation on member removal, attachment encryption, key backup and restore with wrong passphrases, stable order-independent safety numbers |
| `tests/security/adversarial.test.ts` | 11 | Non-members cannot read or post in other people's chats or edit their messages, role escalation rejected, `isUserAdmin` false for bad ids, attachment encryption and tamper detection, rate limiter throttling, script/HTML payloads stored as plain text, key backup brute force |
| `tests/security/authorization.test.ts` | 16 | Static analysis of the SQL migrations (`001`, `003`, `004`): group roles gone, `is_admin()` reads only `profiles.is_admin`, escalation blocked, no `USING (true)` in the `003` policies, device and presence visibility scoped, no plaintext or private-key columns, storage isolation |
| `tests/integration/apiRoutes.test.ts` | 9 | Every data route returns `401` when signed out |
| `tests/chat/chatStore.test.ts` | 8 | The message store in demo mode: defaults, optimistic send, reactions, edit, delete, creating direct and group conversations without duplicates, switching persona |
| `tests/chat/envelopeDisplay.test.ts` | 8 | How message payloads become text and previews, including unknown future kinds and hidden poll votes |

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

## Not yet done

- A CI workflow that runs the four commands above on every pull request.
- Browser end-to-end tests (Playwright) for the journeys above.
- Live database tests (pgTAP or the Supabase CLI) for row level security.
