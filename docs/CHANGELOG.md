# Changelog

Newest first. Dates are when the change was merged.

## Unreleased

- **Dead code removed.** Deleted the obsolete invitation feature (the `/api/invites` routes, `lib/invites`, the admin "Invitation Tokens" panel, the sidebar "Invite" button and the invite dialog, invite state in the store, and their tests). Signup has not needed invites since `007`, so the panel created tokens that nothing accepted. `/invite` now redirects to `/signup` and `/admin/invites` no longer exists. Also removed unused components (`Header`, `Badge`, `Textarea`), the unused `types/index.ts` barrel, unused crypto and store helpers, a duplicate `createClient` export and the unused `tsx` dev dependency. The database still has the unused `invites` table and `consume_invite()` function.
- **Vercel Deployment Protection** documented ([Deployment](DEPLOYMENT.md#vercel-deployment-protection), issue #6).
- **Documentation rewritten.** Replaced the 37 mostly out-of-date documents with a smaller set written from the code. Removed two documents for features the project never had (scraping, advertising).

## 2026-09-19

- **Sign-in errors show their reason** (PR #5). The login page now shows Supabase's explanation when Google or email-link sign-in fails.
- **Continue with Google** (PR #4). New button on sign in and create account; friendly messages for cancelled or failed Google sign-in. Migration `009` creates profiles with the Google name and photo and makes usernames valid and unique (previously two emails with the same part before the `@` made signup fail).
- **Phase 0 foundations** (PR #3). Migration `008` adds the tables to the Realtime publication; edits and deletes from other users now appear live; new message kinds (system, poll, poll vote, call, mentions) with safe display of unknown kinds; conversation previews say "Voice message" or the file name; `Permissions-Policy` now allows camera and microphone for the site.
- **Open registration** (PR #2). Removed the invitation token from signup (migration `007`); password and confirm-password fields with live rules and inline errors; "Check your email" screen with resend, already-registered and unconfirmed handling; `/auth/confirm` accepts PKCE `?code=` links and blocks open redirects; fixed a global `overflow: hidden` that stopped the landing page and forms scrolling.
- **V1 audit and rebuild** (commit `c54c0c7`). See [V1 status](V1_STATUS.md). Highlights: real end-to-end encryption on libsodium in place of base64 "encryption"; messages loaded from the database; honest send states with retry; real encrypted attachments and voice notes; group member management with key rotation; fail-closed production configuration; closed a leak of user emails and phones through the search route; a real `/auth/confirm` route; fixed a state bug where new messages never re-rendered without a refresh.

## 2026-09-18

- Initial release of the V1 codebase: Next.js and Supabase app, SQL migrations `001`-`005`, client-side encryption module, tests, first documentation set.
