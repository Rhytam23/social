# 22_DEPLOYMENT.md — Deployment & Operations Guide

This document details deployment workflows, database migrations, Supabase bucket configuration, and post-deployment validation steps for **Private Chat**.

---

## 1. Prerequisites & Environment Setup

1. **Supabase Project:** Create a new project on [Supabase Dashboard](https://supabase.com).
2. **Environment Configuration:** Obtain project URL, Anon Key, and Service Role Key, and set them in your hosting environment (Vercel / Netlify):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   SUPABASE_SERVICE_ROLE_KEY=ey...
   ```

---

## 2. Database Migration Execution

Execute SQL migration scripts in order using the Supabase SQL Editor or Supabase CLI (`supabase db push`):
1. Execute [`database/migrations/001_initial_schema.sql`](file:///d:/social/database/migrations/001_initial_schema.sql).
2. Execute [`database/migrations/002_rls_policies.sql`](file:///d:/social/database/migrations/002_rls_policies.sql).
3. Execute [`database/migrations/003_security_foundation.sql`](file:///d:/social/database/migrations/003_security_foundation.sql).
4. Execute [`database/migrations/004_storage.sql`](file:///d:/social/database/migrations/004_storage.sql).
5. Execute [`database/functions/atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql).

---

## 3. Build & Deployment Commands

- **Local Build Test:**
  ```bash
  npm run build
  ```
- **Run Production Server:**
  ```bash
  npm run start
  ```

---

## 4. Post-Deployment Verification Checklist

1. Verify RLS policies are active on all tables.
2. Confirm the `attachments` storage bucket exists and is set to `public = false`.
3. Generate an initial admin user profile and issue the first invitation token using `generateInvite()`.
