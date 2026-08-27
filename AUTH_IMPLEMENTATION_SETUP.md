# PREMIUM PC — Authentication Implementation & Production Setup Specification

This document details the discovered production deployment environment, implemented security architecture, environment variables, cloud OAuth settings, and verification results for the **PREMIUM PC** e-commerce platform.

---

## 1. Discovered Deployment Environment

| Layer | Provider / Platform | Production URL / Identifier |
| :--- | :--- | :--- |
| **Frontend Hosting** | **Vercel** | `https://clint-version.vercel.app` *(Frontend SPA application)* |
| **Backend API Hosting** | **Render** | `https://clint-version.onrender.com` *(Live Node.js + Express Web Service)* |
| **Database Hosting** | **Neon Cloud** | `ep-gentle-shape-aylpm2jm-pooler.c-5.us-east-2.aws.neon.tech` *(Serverless PostgreSQL)* |

---

## 2. Implemented Security Architecture

### 2.1 Google & GitHub OAuth Integration
- **Google Authorized JavaScript Origin**:
  - Production: `https://clint-version.vercel.app`
  - Development: `http://localhost:5173`
- **Google Authorized Redirect URI**:
  - Production: `https://clint-version.onrender.com/api/auth/google/callback`
  - Development: `http://localhost:3001/api/auth/google/callback`
- **GitHub Homepage URL**:
  - Production: `https://clint-version.vercel.app`
  - Development: `http://localhost:5173`
- **GitHub Authorization Callback URL**:
  - Production: `https://clint-version.onrender.com/api/auth/github/callback`
  - Development: `http://localhost:3001/api/auth/github/callback`
- **CSRF State Protection**:
  - 32-byte cryptographically random `state` generated on `/api/auth/google` and `/api/auth/github`.
  - Stored in temporary HTTP-only cookie `oauth_state` (`Max-Age=600`, `HttpOnly`, `SameSite=Lax`).
  - Verified in OAuth callback handlers to prevent request forgery and state tampering.

### 2.2 Strict HTTP-Only Cookie Session Security
- **No `localStorage` Tokens**: Complete removal of `tokenStore` and `localStorage` token retention. Tokens are never stored in browser `localStorage` or returned in JSON payloads.
- **HTTP-Only Cookies**: All session tokens are managed exclusively via HTTP-only cookies (`token`):
  ```http
  Set-Cookie: token=<jwt>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure
  ```
- **Backend Authentication**: [`server/src/middleware/auth.ts`](file:///e:/projesct01/server/src/middleware/auth.ts) inspects `req.cookies.token` as the primary session mechanism.
- **Session Logout**: `POST /api/auth/logout` clears the `token` cookie (`Max-Age=0`) and invalidates session state.

### 2.3 Safe OTP Migration & Hashed Security
- **Safe Migration (`003_auth_security_oauth.sql`)**:
  - Non-destructive update marking legacy unhashed OTP records as expired.
  - Added `code_hash` column (VARCHAR(255)), `attempts` (INT DEFAULT 0), and `max_attempts` (INT DEFAULT 5).
  - Made legacy `code` column nullable to preserve historical data without constraint errors.
- **OTP Hashing**: 6-digit OTP codes are hashed using SHA-256 before insertion into PostgreSQL.
- **Rate & Attempt Limits**:
  - Rate limit: Max 3 OTP requests per 15 minutes per email/IP.
  - Attempt limit: Max 5 verification attempts per OTP code before immediate invalidation.

### 2.4 Account Linking & Account Takeover Prevention
- Match incoming Google/GitHub user by `google_id` or `github_id`.
- If user exists by email and `email_verified` is `true`, link provider ID safely.
- If existing account is unverified, reject automatic OAuth linking to prevent account takeover vectors.

---

## 3. Environment Variables Specification

### 3.1 Backend Environment Variables (`Render`)

| Variable Name | Required | Example / Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `3001` |
| `DATABASE_URL` | Yes | `postgresql://neondb_owner:...@ep-gentle-shape-aylpm2jm-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Yes | `premiumpc_super_secret_jwt_key_2026_x987y` |
| `FRONTEND_URL` | Yes | `https://clint-version.vercel.app` |
| `CORS_ORIGIN` | Yes | `https://clint-version.vercel.app` *(Exact origin required for credentialed cookies)* |
| `GOOGLE_CLIENT_ID` | Yes | `123456789012-abc...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | `<google_client_secret>` |
| `GITHUB_CLIENT_ID` | Yes | `Ov23...` |
| `GITHUB_CLIENT_SECRET` | Yes | `1a2b3c...` |
| `RESEND_API_KEY` | Optional | `re_123456789...` |

### 3.2 Frontend Environment Variables (`Vercel`)

| Variable Name | Required | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Yes | `https://clint-version.onrender.com` |
| `VITE_ENABLE_BACKEND` | Yes | `true` |

---

## 4. Third-Party Console Setup Instructions

### 4.1 Google Cloud Console Setup
1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Select or create project **`PREMIUM PC`**.
3. Configure OAuth consent screen (App name: `PREMIUM PC`, Scopes: `openid`, `email`, `profile`).
4. Create **OAuth 2.0 Client ID** (Web application):
   - **Authorized JavaScript origins**:
     - `https://clint-version.vercel.app` *(Production)*
     - `http://localhost:5173` *(Development)*
   - **Authorized redirect URIs**:
     - `https://clint-version.onrender.com/api/auth/google/callback` *(Production)*
     - `http://localhost:3001/api/auth/google/callback` *(Development)*
5. Copy **Client ID** and **Client Secret** into Render environment variables.

### 4.2 GitHub Developer Settings Setup
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps**.
2. Click **New OAuth App**:
   - **Application name**: `PREMIUM PC`
   - **Homepage URL**: `https://clint-version.vercel.app` *(Development: `http://localhost:5173`)*
   - **Authorization callback URL**: `https://clint-version.onrender.com/api/auth/github/callback` *(Development: `http://localhost:3001/api/auth/github/callback`)*
3. Copy **Client ID** and **Client Secret** into Render environment variables.

---

## 5. Final Production Deployment Checklist

- [x] **Database Migration Executed**: `003_auth_security_oauth.sql` applied to Neon Cloud DB.
- [x] **Backend Build & Integration Test Suite**: 11/11 tests passed cleanly.
- [x] **Frontend TypeScript & Vite Production Build**: Compiled with 0 errors.
- [ ] **Configure Render Environment Variables**: Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `FRONTEND_URL`, and update `CORS_ORIGIN=https://clint-version.vercel.app`.
- [ ] **Git Push to Main**: Deploy updated code to Render and Vercel.
