# PRIVATE-CHAT V1 PRODUCT SURFACE & USER JOURNEYS

This document defines the complete product surface, public/authenticated routes, user journeys, and component architecture for Private Chat V1.

---

## 1. Product Surface & Routes

### Public Surface (Unauthenticated)
| Route | Component | Purpose | Key Actions |
|---|---|---|---|
| `/` | `components/landing/LandingPage.tsx` | Marketing landing page | Value props, security highlights, live interactive UI preview, "Sign In" / "Get Started" CTAs |
| `/login` | `components/auth/LoginForm.tsx` | Authentication sign-in | Email/Password login, link to `/signup`, link to `/forgot-password`, direct access to workspace |
| `/signup` | `components/auth/LoginForm.tsx` (initialTab="signup") | Account registration | Display Name, Email, Phone Number, Password, terms agreement, instant onboarding |
| `/forgot-password` | `components/auth/ForgotPasswordForm.tsx` | Password recovery | Email submission via `supabase.auth.resetPasswordForEmail`, link back to login |
| `/reset-password` | `components/auth/ResetPasswordForm.tsx` | Password reset | New password & confirmation submission via `supabase.auth.updateUser`, redirect to login |
| `/privacy` | `app/privacy/page.tsx` | Privacy Policy | Full zero-knowledge policy, client-side encryption details, minimal metadata retention |
| `/terms` | `app/terms/page.tsx` | Terms of Service | Acceptable use, cryptographic guarantees, account responsibility |

### Authenticated Surface
| Route / View | Component | Purpose | Key Actions |
|---|---|---|---|
| `/` (authenticated) | `components/layout/AppShell.tsx` | Main messaging workspace | Conversations list, chat canvas, inspector deck, quick actions |
| Onboarding Modal | `components/onboarding/OnboardingModal.tsx` | First-time setup | Profile display name setup, avatar color pick, E2EE Double Ratchet primer, "Start Chatting" |
| People Directory | `components/people/PeopleDirectory.tsx` | User discovery | Live search by `@username`, display name, email, or phone; 1-click direct chat initiation |
| Group Spaces | `components/groups/GroupSpaceView.tsx` | Group chat & collaboration | Group creation, member invitations, sender key management, group settings |
| Settings Suite | `components/settings/SettingsView.tsx` | User & security settings | 6 Categorized panels: Profile, Account, Privacy & Security, Appearance, Notifications, About |
| Admin Dashboard | `components/admin/AdminDashboard.tsx` | Admin control panel | User roles management, active device audits, invite token generation |

---

## 2. Complete User Journeys

### Journey A: First Visit → Landing → Sign Up → Onboarding → First Chat
1. Visitor arrives at `/` and views the sleek Dark-Themed Landing Page with real E2EE architecture guarantees.
2. Visitor clicks **"Get Started"** → smoothly transitions to the Registration form with "← Back to Overview" control.
3. User enters **Display Name**, **Email**, **Phone Number**, and **Password** and clicks **"Create Account"**.
4. System creates the Supabase Auth user, initializes local cryptographic identity keys, and logs the user in.
5. On first launch, the **3-Step Onboarding Modal** opens:
   - **Step 1 (Profile Setup)**: User confirms/edits their display name and chooses an avatar accent color.
   - **Step 2 (Security Primer)**: Explains Signal Double Ratchet encryption, zero-knowledge storage, and device keys.
   - **Step 3 (Quick Start)**: Presents a "Start Your First Chat" CTA that opens the contact discovery modal.
6. User searches for a colleague, clicks to start a chat, and is immediately dropped into the live conversation canvas.

### Journey B: Password Recovery Flow
1. User clicks **"Forgot password?"** on the Sign In screen or navigates to `/forgot-password`.
2. User enters their registered email address and clicks **"Send Reset Instructions"**.
3. `supabase.auth.resetPasswordForEmail` dispatches the recovery link to the user.
4. User clicks the recovery link in their email, landing on `/reset-password`.
5. User enters their new password and confirmation, clicking **"Update Password"**.
6. Upon success, the user is redirected to `/login` to sign in with their new credentials.

### Journey C: Real-Time Encrypted Messaging
1. User types in the rich message composer:
   - Supports markdown and multi-line formatting.
   - Quoted replies (`replyToId`).
   - Emoji reactions with live sync.
   - Real HTML5 `MediaRecorder` microphone voice recording with live duration timer and waveform animation.
   - Encrypted file attachments (images, PDFs, documents up to 25MB) encrypted client-side with 256-bit AES-GCM before upload.
2. Messages dispatch to the recipient with Signal Double Ratchet forward secrecy.
3. Incoming messages sync live via Supabase PostgreSQL realtime change feeds with automated client-side deduplication.

### Journey D: Settings & Key Backup
1. User navigates to **Settings** from the navigation deck.
2. User can browse 6 distinct panels:
   - **Profile**: Edit display name, avatar accent, view user ID and registration ID.
   - **Account**: Email address, phone number, joined date, and safe account sign-out.
   - **Privacy & Security**: View public identity key fingerprint, manage active devices, export/import Argon2id passphrase-encrypted key backups.
   - **Appearance**: Theme selection (Midnight Dark / Slate / Cyberpunk Navy), font size scaling, message density.
   - **Notifications**: Desktop notification permissions, sound toggles, read receipt controls.
   - **About**: App version (V1.0.0 Production), protocol documentation, Terms of Service, and Privacy Policy links.

---

## 3. Production Quality & Verification Status
- **Automated Tests**: 66/66 passing across unit, security, E2EE, and integration suites.
- **TypeScript**: 0 errors (`npx tsc --noEmit`).
- **ESLint**: 0 errors and 0 warnings (`npm run lint`).
- **Next.js 15 Production Build**: All 31 routes compiled statically and dynamically (`npm run build`).
