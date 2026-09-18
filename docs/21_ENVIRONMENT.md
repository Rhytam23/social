# 21_ENVIRONMENT.md — Environment Configuration Specification

This document details all environment variables referenced in **Private Chat**, their required status, fallback defaults, and secret classifications.

---

## Environment Variable Matrix

| Variable Name | Required / Optional | Scope | Secret Status | Purpose & Usage Location | Default Fallback |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Client & Server | Public | Supabase API endpoint URL ([`lib/supabase/client.ts`](file:///d:/social/lib/supabase/client.ts#L4)) | `https://placeholder-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Client & Server | Public | Supabase anonymous API key ([`lib/supabase/client.ts`](file:///d:/social/lib/supabase/client.ts#L5)) | Placeholder JWT string |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required (Server)** | Server-Only | **CRITICAL SECRET** | Supabase admin service role key ([`lib/supabase/admin.ts`](file:///d:/social/lib/supabase/admin.ts#L5)) | Placeholder JWT string |

---

## Rules & Security Guidance

1. **Server Secret Isolation:** `SUPABASE_SERVICE_ROLE_KEY` MUST NEVER be prefixed with `NEXT_PUBLIC_` and MUST NEVER be imported in client-side code.
2. **Local Template:** Real credentials must be configured in `.env.local`. Reference definitions are maintained in [`.env.example`](file:///d:/social/.env.example).
