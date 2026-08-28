# PREMIUM PC — Security Policy & Secret Management Guidelines

This document outlines the security architecture, credential management policies, environment variable controls, and incident response procedures for the **PREMIUM PC** platform.

---

## 1. Secret Management & Environment Isolation

### 1.1 Strict Frontend/Backend Separation
- **Public Frontend (`VITE_*`)**:
  - The React SPA bundled by Vite runs in client browsers. Any variable prefixed with `VITE_` is exposed to the public.
  - **Allowed**: `VITE_API_URL`, `VITE_APP_TITLE`, `VITE_API_TIMEOUT`.
  - **Forbidden**: Database connection strings (`DATABASE_URL`), OAuth client secrets (`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`), JWT secrets (`JWT_SECRET`), API keys (`RESEND_API_KEY`).
- **Private Backend Environment Variables**:
  - All secret keys must exist **only** on the backend Node.js server (Render / local `server/.env`).
  - All secrets are ignored by version control (`.gitignore`).

### 1.2 Git Secret Prevention Rules
- Never commit `.env`, `.env.production`, `.env.local`, or any credentials file.
- Only `.env.example` containing generic placeholders may be committed to Git.
- Always check `git status` and `git diff` before staging commits.

---

## 2. Authentication & Session Security Architecture

### 2.1 Cookie-Based Sessions
- Authentication tokens are issued exclusively via **HTTP-Only, Secure, SameSite=Lax** session cookies (`token`).
- Tokens are **never** stored in browser `localStorage`, `sessionStorage`, or returned in JSON response bodies.

### 2.2 CSRF & OAuth State Validation
- OAuth endpoints (`/api/auth/google` & `/api/auth/github`) issue a 32-byte cryptographically random `state` token saved in a short-lived HTTP-only cookie (`oauth_state`).
- Callback handlers verify `req.query.state === req.cookies.oauth_state` before processing authorization codes.

### 2.3 Cryptographic OTP Hashing & Rate Limits
- OTP 6-digit codes are stored exclusively as SHA-256 hashes (`code_hash`). Plaintext OTPs are never stored in PostgreSQL.
- Rate Limit: Maximum 3 OTP requests per 15-minute window per IP/email.
- Attempt Limit: Maximum 5 failed verification attempts before the OTP is invalidated.

---

## 3. Mandatory Credential Rotation Checklist

Because production `.env.production` files were previously committed in earlier repository history (commit `4453243` and `f92d7b5`), **all exposed production credentials must be treated as compromised** and rotated manually in their respective cloud dashboards:

1. **Neon Cloud PostgreSQL Password**:
   - Go to [console.neon.tech](https://console.neon.tech) → Dashboard → Roles → Reset Password for `neondb_owner`.
   - Update `DATABASE_URL` in Render Environment Variables.
2. **JWT Secret Key**:
   - Generate a new 64-byte random string (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`).
   - Update `JWT_SECRET` in Render Environment Variables.
3. **Google OAuth Client Secret**:
   - Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Reset Client Secret.
   - Update `GOOGLE_CLIENT_SECRET` in Render Environment Variables.
4. **GitHub OAuth Client Secret**:
   - Go to [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → Generate a new client secret.
   - Update `GITHUB_CLIENT_SECRET` in Render Environment Variables.
5. **Resend Email API Key** *(if configured)*:
   - Go to [resend.com](https://resend.com) → API Keys → Revoke old key and generate a new key.
   - Update `RESEND_API_KEY` in Render Environment Variables.

---

## 4. Security Audit Verification Summary

- [x] **Git Tracking Security**: `.env.production` and `server/.env.production` removed from Git index (`git rm --cached`).
- [x] **Frontend Secret Audit**: Verified zero exposed secret strings in React SPA source and production build bundle (`dist/`).
- [x] **CORS Enforcement**: Production CORS restricted to `https://clint-version.vercel.app` with `credentials: true`.
- [x] **Dependency Audit**: `npm audit` returned 0 vulnerabilities on frontend.
- [x] **Build & Test Matrix**: Frontend build passed (0 errors); Backend test suite passed (11/11 tests).
