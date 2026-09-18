# PRIVATE-CHAT — V1 LIVE PRODUCTION DEPLOYMENT GUIDE

This guide walks through configuring and deploying PRIVATE-CHAT to production with a real, cloud-hosted Supabase backend.

---

## 1. Create a Supabase Project

1. Log into your account at [supabase.com](https://supabase.com).
2. Click **"New Project"**.
3. Fill in:
   - **Name**: `private-chat-prod` (or your preferred name)
   - **Database Password**: Generate a secure, high-entropy password (store it securely in your password manager).
   - **Region**: Choose the region closest to your primary user base (e.g., `us-east-1`, `eu-west-1`).
4. Wait for the project initialization to complete.

---

## 2. Apply Database Migrations

Navigate to **SQL Editor** in the Supabase Dashboard and execute the SQL migration scripts located in `database/migrations/` in sequential order:

1. **`001_initial_schema.sql`**: Creates tables (`profiles`, `invites`, `conversations`, `conversation_members`, `messages`, `message_reactions`, `message_receipts`, `user_devices`, `group_key_envelopes`, `presence`) and indexes.
2. **`002_rls_policies.sql`**: Enables Row Level Security on all tables and installs security helper functions (`is_conversation_member`, `is_admin`, etc.).
3. **`003_security_foundation.sql`**: Removes legacy group-admin roles (all group members equal), hardens `profiles.is_admin` escalation prevention triggers, installs `shares_conversation_with` visibility helpers, adds missing composite indexes, and creates `set_updated_at` triggers.
4. **`004_storage.sql`**: Creates the private `encrypted_attachments` and `attachments` storage buckets and applies RLS policies restricting read/write access to conversation participants.

> **Tip**: You can also use the Supabase CLI:
> ```bash
> supabase link --project-ref your-project-ref
> supabase db push
> ```

---

## 3. Configure Supabase Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Email**:
   - Ensure **Enable Email provider** is turned **ON**.
   - Set **Confirm email** according to your preference (for quick private onboarding, it can be disabled; for public deployments, enable email verification).
2. Under **Authentication** → **URL Configuration**:
   - **Site URL**: `https://your-domain.com` (or your deployment URL).
   - **Redirect URLs**: Add `https://your-domain.com/**` and `https://your-domain.com/login`.

---

## 4. Configure Supabase Realtime

1. In Supabase Dashboard, navigate to **Database** → **Replication** (or **Realtime**).
2. Enable Realtime broadcast and listen events for the following tables:
   - `public.messages` (Realtime message delivery)
   - `public.message_reactions` (Live reaction updates)
   - `public.message_receipts` (Read/delivered receipts)
   - `public.conversation_members` (Group participant changes)
   - `public.presence` (Online status)
3. Confirm that Postgres Row Level Security (RLS) is active on all replicated tables so that postgres change feeds are strictly filtered by RLS policies before delivery to connected clients.

---

## 5. Configure Supabase Storage

1. Navigate to **Storage** → **Buckets**.
2. Verify that bucket `encrypted_attachments` exists and has **Public Bucket = FALSE** (Private).
3. If not already created via migration `004_storage.sql`:
   - Create bucket `encrypted_attachments` with **Public bucket** toggled **OFF**.
   - Ensure the max file size limit is set to `25MB`.
   - Allowed MIME types: `application/octet-stream` (all client uploads are encrypted binary payloads).

---

## 6. Configure Production Environment Variables

Set the following environment variables in your hosting provider (e.g., Vercel, Railway, Node server):

```env
# Public Supabase Client (Exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-Only Supabase Admin (CRITICAL SECRET - NEVER PREFIX WITH NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production Rate Limiting (Optional - Upstash Redis for distributed multi-instance limiting)
UPSTASH_REDIS_REST_URL=https://<your-redis-instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security policies. It is used exclusively on the server (e.g. `lib/supabase/admin.ts`). **NEVER expose this key to client-side code or prefix it with `NEXT_PUBLIC_`.**

---

## 7. Build and Start the Application

### Deploying to Vercel
1. Import repository into Vercel.
2. Add the environment variables configured in Step 6.
3. Deploy.

### Deploying with Node / Docker
```bash
# Install dependencies
npm ci

# Verify tests and types
npm test
npx tsc --noEmit
npm run lint

# Build production bundle
npm run build

# Start production server (default port 3000)
npm run start
```

---

## 8. Two-User Production Smoke Test

Once deployed, perform the following verification with two real user accounts:

1. **User Registration & Login**:
   - Open Browser A (User A: `alice@yourdomain.com`). Register, log in, set profile name.
   - Open Browser B in Incognito / separate browser (User B: `bob@yourdomain.com`). Register and log in.
2. **Direct Messaging**:
   - In Browser A, click **New Chat** → Search for `bob` → Start conversation.
   - Send encrypted message: *"Hello Bob, this is a live E2EE test!"*.
   - Verify Browser B receives the message in real time with correct sender name and timestamp.
3. **Interactions**:
   - In Browser B, add an emoji reaction and reply to the message.
   - Verify Browser A reflects the reaction and quoted reply in real time.
4. **Encrypted Attachment**:
   - In Browser A, attach an image/PDF.
   - Verify it encrypts client-side, uploads to `encrypted_attachments`, and decrypts smoothly in Browser B.
5. **Unauthorized Isolation**:
   - Register User C (`carol@yourdomain.com`).
   - Verify Carol cannot view, search, subscribe to, or access Alice & Bob's conversation or attachments.
