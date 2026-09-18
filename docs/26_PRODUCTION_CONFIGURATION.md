# 26_PRODUCTION_CONFIGURATION.md — Definitive Production Setup & Integration Guide

This document provides the practical, step-by-step launch configuration reference for deploying **Private Chat** to a 100-user production environment.

---

## 1. Required Services Inventory

| Service | Required? | Purpose | Provider | Free Tier / Cost Bounds |
|---|---|---|---|---|
| **Supabase Project** | **YES** | Database (PostgreSQL 15+), Auth engine, Storage bucket (`attachments`), Realtime WebSockets | Supabase Cloud | Free Tier handles 500MB DB, 1GB Storage, 50,000 MAU (Sufficient for 100 users) |
| **Hosting Platform** | **YES** | Hosting Next.js App Router (Node.js runtime, Edge Middleware, Static asset delivery) | Vercel / Netlify | Free Hobby / Pro Plan |
| **Domain & DNS** | **YES** | Custom domain & SSL certificate enforcement | Cloudflare / Namecheap | ~$10/year |
| **Upstash Redis** | **OPTIONAL (P1)** | Server-side IP rate-limiting for Next.js API endpoints & Auth routes | Upstash | Free Tier (10,000 req/day) |

---

## 2. Required Environment Variables Matrix

| Variable Name | Required | Secret? | Client / Server | Purpose & Usage Location | Default / Example Value |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **YES** | Public | Both | Supabase API HTTPS URL ([`lib/supabase/client.ts`](file:///d:/social/lib/supabase/client.ts)) | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **YES** | Public | Both | Supabase Anonymous public API key | `eyJhbGciOiJIUzI1NiIsIn...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | **CRITICAL SECRET** | **SERVER-ONLY** | Supabase Admin Service Role key ([`lib/supabase/admin.ts`](file:///d:/social/lib/supabase/admin.ts)) | `eyJhbGciOiJIUzI1NiIsIn...` |
| `UPSTASH_REDIS_REST_URL` | **OPTIONAL** | Secret | Server-Only | Upstash Redis REST API Endpoint (Rate-limiting) | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | **OPTIONAL** | Secret | Server-Only | Upstash Redis REST Auth Token | `AX...` |

---

## 3. Step-by-Step Credential Procurement Guide

### 3.1 Supabase Credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, set project name to `private-chat-production`, choose a secure database password, and select region.
3. Once provisioned, navigate to **Project Settings** → **API**.
4. Copy:
   - **Project URL** → set as `NEXT_PUBLIC_SUPABASE_URL`.
   - **`anon` `public` API Key** → set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **`service_role` `secret` API Key** → set as `SUPABASE_SERVICE_ROLE_KEY` (MUST NEVER be exposed to browser).

---

## 4. Sequential Integration & Production Deployment Guide

### Step 1: Database Schema & Migration Execution
Run the following SQL files in exact order inside the Supabase SQL Editor:
1. [`database/migrations/001_initial_schema.sql`](file:///d:/social/database/migrations/001_initial_schema.sql)
2. [`database/migrations/002_rls_policies.sql`](file:///d:/social/database/migrations/002_rls_policies.sql)
3. [`database/migrations/003_security_foundation.sql`](file:///d:/social/database/migrations/003_security_foundation.sql)
4. [`database/migrations/004_storage.sql`](file:///d:/social/database/migrations/004_storage.sql)
5. [`database/functions/atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql)

### Step 2: Supabase Storage Bucket Verification
1. Go to **Storage** in Supabase Dashboard.
2. Verify bucket `attachments` is created and configured as **Private** (`public: false`).

### Step 3: Supabase Authentication Configuration
1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to `https://your-domain.com`.
3. Add `https://your-domain.com/**` to **Redirect URLs**.
4. Go to **Authentication** → **Providers** → **Email**: Ensure Email/Password provider is enabled. Disable "Allow unconfirmed emails" for production.

### Step 4: Vercel / Hosting Deployment
1. Import `private-chat` repository into Vercel.
2. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Deploy**.

### Step 5: Initial Administrator Bootstrap
1. In Supabase Dashboard, go to **Authentication** → **Users** → Add User (e.g. `admin@your-domain.com`). Copy generated User UUID.
2. In SQL Editor, create the primary admin profile:
   ```sql
   INSERT INTO public.profiles (id, username, display_name, is_admin)
   VALUES ('<COPIED_USER_UUID>', 'admin', 'System Admin', true);
   ```
3. Generate the first user registration invite using the admin dashboard or server utility function.
