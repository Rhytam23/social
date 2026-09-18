# 19_DATABASE_SECURITY.md — Database Security Audit

This document presents a database-specific security audit evaluating Row Level Security (RLS) policies, SECURITY DEFINER functions, RPC execution privileges, and privilege escalation risks.

---

## 1. RLS Policy Audit & Privilege Analysis

All 10 application tables in `public` have Row Level Security enabled ([`002_rls_policies.sql`](file:///d:/social/database/migrations/002_rls_policies.sql#L5-L14)):
1. `profiles`: Read-accessible to all `authenticated` users; updates restricted to `id = auth.uid()`. Admin escalation blocked by trigger.
2. `invites`: Restricted exclusively to `public.is_admin()` for SELECT, INSERT, UPDATE, DELETE.
3. `conversations`: Read/update restricted to conversation members (`is_conversation_member(id)`). Deletion restricted to admins.
4. `conversation_members`: SELECT/INSERT restricted to existing conversation members or creators. Self-join by arbitrary non-members is strictly blocked ([`003_security_foundation.sql`](file:///d:/social/database/migrations/003_security_foundation.sql#L166)).
5. `messages`: Read/Insert restricted to active conversation members (`sender_id = auth.uid() AND is_conversation_member(conversation_id)`).
6. `user_devices` & `presence`: SELECT restricted to owner or mutual conversation participants (`shares_conversation_with(user_id)`).
7. `group_key_envelopes`: INSERT validated by `is_valid_group_key_recipient(conversation_id, user_id, device_id)` helper function.

---

## 2. SECURITY DEFINER Functions & RPC Hardening

### 2.1 `public.is_admin()`
- **Security Scope:** `SECURITY DEFINER SET search_path = public`.
- **Implementation:** Queries `public.profiles.is_admin` column for `auth.uid()`. Execution granted to `authenticated` and `service_role`. Execution REVOKED from `PUBLIC`.

### 2.2 `public.consume_invite(p_token_hash, p_user_id, p_assigned_email)`
- **Security Scope:** `SECURITY DEFINER SET search_path = public`.
- **Caller Restriction:** Execution granted **EXCLUSIVELY** to `service_role` ([`atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql#L100)). REVOKED from `PUBLIC` and `authenticated`.
- **Atomic Locking:** Executes `SELECT * FROM public.invites ... FOR UPDATE` to prevent concurrent token reuse race conditions.
- **Exception Handling:** Contains generic error messages to prevent database error disclosure.

---

## 3. Database Vulnerability Summary

- **Privilege Escalation:** Fully mitigated via `prevent_profile_admin_escalation` trigger (blocks non-service-role changes to `is_admin`).
- **SQL Injection:** Fully mitigated (PostgreSQL PL/pgSQL parameter binding used throughout).
- **Search Path Hijacking:** Mitigated by explicit `SET search_path = public` on all stored functions.
