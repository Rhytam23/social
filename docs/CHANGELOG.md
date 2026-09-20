# Changelog

Newest first. Dates are when the change was merged.

## Unreleased

**Platform release: design system, profiles, chat polish, groups, threads, notifications, communities, privacy and calls.** Needs migrations `011` to `015` and has **not been run against a live Supabase project**; see [Roadmap](ROADMAP.md#what-is-verified).

- **Design system.** Theme tokens with dark, light and system themes; accessible dialog, toast, avatar, badge, switch, skeleton, empty and error states; Ctrl+K quick switcher and shortcuts list; skip link, landmarks, offline banner; the animation classes the app already used now actually animate.
- **Profiles and settings.** Bio, pronouns, time zone, username validation, appearance settings, four-step onboarding with a key-backup step, per-user preferences saved to the profile. **Email and phone are hidden from other users** (`011`). The Settings screen no longer shows a hard-coded identity fingerprint.
- **Chat.** Reactions load and update live, read receipts, server-side unread counts, presence with manual statuses (Active, Do Not Disturb, Away, In a meeting, Appear offline) and idle-to-away after 5 minutes, typing indicators, load-earlier-messages, saved messages, formatting (bold, italic, code, quotes, links), @mentions, media, files and links tabs, touch-friendly message actions.
- **Groups.** Owner, admin and member roles, admin-only posting, description, leave with ownership transfer, system messages, key rotation when someone leaves, threads.
- **Notifications.** Per-chat all, mentions-only and timed mute; quiet hours; keywords; desktop notifications and a sound; a notification centre for mentions; unread count in the tab title.
- **Communities.** Community rail, public and private channels, invite links, roles, member management.
- **Privacy.** Disappearing messages, blocking, reporting, app lock, key-change warnings and a working "mark verified", sign out other devices, data export.
- **Calls.** One-to-one voice and video over WebRTC with end-to-end encrypted signalling and optional TURN (`TURN_URLS` and friends).

- **Visual redesign.** One design system across the app ([Design](DESIGN.md)): a neutral dark palette with a restrained blue-cyan accent (replacing the green), Geist type, softer radii, shadows and an edge light instead of glow, and shared `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `.panel` and `.floating` building blocks. Every white or default-styled button now uses the shared button, forms use one field style, menus and dialogs share one floating surface, avatars use muted tones, and screens fade in. Reduced motion is respected everywhere.
- **New landing page.** A scroll-driven story (messages, threads, communities, enter the app) over an interactive three.js scene of the product's own objects, with cursor parallax, lighting and shadows. It is lazy-loaded on the landing page only and falls back to the same story as stills for reduced motion, no WebGL, data saver or weak devices, and it degrades itself if frames are slow. Adds `three` and `geist` dependencies.
- **Navigation and discovery.** Settings is a button at the bottom left of the sidebar and opens a proper settings area with separate sections (Profile, Account, Privacy, Security, Appearance, Notifications, Devices, Data, About): a sidebar on desktop, list then detail on phones. The lock button in the left rail is now labelled **Chat** and shows only direct conversations; the **+** is **Groups** (create a group, create a community, join with an invite link or code) and Groups shows only groups. **People are found by exact username only** (`GET /api/users?username=`): names, email addresses and phone numbers are no longer searchable, the full member directory is gone, and migration `016` removes client access to the old email/phone lookup.
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
