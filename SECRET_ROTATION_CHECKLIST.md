# PREMIUM PC — Secret Rotation Checklist

This document tracks all production credentials identified during the security audit, detailing where to perform manual rotation and where updated replacements belong.

> [!IMPORTANT]
> **Manual Action Required**: Do not commit replacement secrets to Git. Enter new credential values directly into your provider deployment dashboards (Render / Vercel) and local untracked `.env` files.

---

## Secret Rotation Matrix

| Secret Type | Service Provider | Where to Rotate | Where Replacement Belongs | Rotation Status |
| :--- | :--- | :--- | :--- | :---: |
| **Database Password** | **Neon Cloud PostgreSQL** | [console.neon.tech](https://console.neon.tech) → Project Roles → Reset Password | Render Env (`DATABASE_URL`) & local `server/.env` | ⏳ Pending Manual Action |
| **JWT Signing Secret** | **Express Backend** | Generate new 64-byte random hex key locally | Render Env (`JWT_SECRET`) & local `server/.env` | ⏳ Pending Manual Action |
| **Google OAuth Client Secret** | **Google Cloud Console** | [console.cloud.google.com](https://console.cloud.google.com) → Credentials → Reset Secret | Render Env (`GOOGLE_CLIENT_SECRET`) & local `server/.env` | ⏳ Pending Manual Action |
| **GitHub OAuth Client Secret** | **GitHub Developer Settings** | [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → Generate Secret | Render Env (`GITHUB_CLIENT_SECRET`) & local `server/.env` | ⏳ Pending Manual Action |
| **Resend API Key** *(if active)* | **Resend Mail** | [resend.com](https://resend.com) → API Keys → Revoke & Create New Key | Render Env (`RESEND_API_KEY`) & local `server/.env` | ⏳ Pending Manual Action |

---

## Step-by-Step Manual Rotation Guide

### 1. Rotate Neon Database Password
1. Log in to [console.neon.tech](https://console.neon.tech).
2. Select your database project → Go to **Roles**.
3. Select `neondb_owner` → Click **Reset Password**.
4. Copy the new connection string and update `DATABASE_URL` in your **Render Environment Variables** tab.

### 2. Rotate JWT Secret Key
1. Generate a new secret key in your terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Copy the generated string and update `JWT_SECRET` in your **Render Environment Variables** tab.

### 3. Rotate Google OAuth Client Secret
1. Log in to [console.cloud.google.com](https://console.cloud.google.com).
2. Go to **APIs & Services** → **Credentials** → Select your OAuth 2.0 Web Client.
3. Click **Reset Secret** / **Add Secret**.
4. Copy the new secret and update `GOOGLE_CLIENT_SECRET` in your **Render Environment Variables** tab.

### 4. Rotate GitHub OAuth Client Secret
1. Log in to [github.com/settings/developers](https://github.com/settings/developers).
2. Select **OAuth Apps** → Select `PREMIUM PC`.
3. Click **Generate a new client secret** (and revoke the old secret).
4. Copy the new secret and update `GITHUB_CLIENT_SECRET` in your **Render Environment Variables** tab.
