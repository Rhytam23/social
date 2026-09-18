# External API & Service Integration Guide — Private Chat

This document lists the external services and credentials required to run **Private Chat** in production.

---

## Required & Recommended Services

| Service Name | Required | Purpose | Free Tier Available? | Client/Server |
|---|---|---|---|---|
| **Supabase Cloud** | **YES** | PostgreSQL 15+ DB, Auth, Storage bucket (`attachments`), Realtime WebSockets | **YES** (500MB DB, 1GB Storage, 50,000 MAU) | Both (`NEXT_PUBLIC_` for client, `SERVICE_ROLE` for server) |
| **Upstash Redis** | **OPTIONAL** | Server-side IP rate limiting for API & auth endpoints | **YES** (10,000 free requests/day) | Server-Only |

---

## Credentials Setup Guide

### 1. Supabase Project Setup (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Purpose:** Database storage, single-use invite RPC, authentication, and file attachment storage.
- **Where to obtain:**
  1. Go to [https://supabase.com](https://supabase.com) and create a free account.
  2. Click **New Project**, choose a name (e.g. `private-chat-prod`), region, and secure DB password.
  3. Navigate to **Project Settings** → **API**.
  4. Copy:
     - **Project URL** → set in `NEXT_PUBLIC_SUPABASE_URL`.
     - **`anon` `public` Key** → set in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
     - **`service_role` `secret` Key** → set in `SUPABASE_SERVICE_ROLE_KEY`.
- **Security Notes:** `SUPABASE_SERVICE_ROLE_KEY` has full administrative database privileges. **MUST NEVER be exposed to the browser or prefixed with `NEXT_PUBLIC_`.**

---

### 2. Upstash Redis (Optional Rate-Limiting) (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- **Purpose:** Protection against brute-force registration or login attempts.
- **Where to obtain:**
  1. Go to [https://upstash.com](https://upstash.com) and create a free account.
  2. Create a Redis database instance.
  3. Copy **REST URL** and **REST Token** from the database dashboard.
- **Security Notes:** Server-side environment variables only.
