# 09_ERROR_HANDLING.md — Error Handling Strategy & Weaknesses

This document details error handling behaviors across frontend, API, database, and cryptographic layers in **Private Chat**.

---

## 1. Error Handling Layers

### 1.1 Database & RPC Layer
- **`consume_invite` Stored Procedure:** Includes a PL/pgSQL `EXCEPTION WHEN OTHERS` handler returning stable, non-sensitive JSON error objects (`jsonb_build_object('success', false, 'message', '...')`). Raw SQL errors (`SQLERRM`) are **never** returned to callers.

### 1.2 Cryptographic Engine Layer ([`crypto/`](file:///d:/social/crypto))
- **Key Store Guard:** Throws explicit errors when identity key pairs are uninitialized (`Identity key pair not initialized`).
- **Decryption Failures:** Throws an explicit error on corrupt payload or unsupported Signal message type (`Unsupported Signal message type`).
- **Key Backup Restoration:** Wraps `crypto.subtle.decrypt` in a try/catch block throwing a user-friendly error (`Failed to restore backup: Invalid passphrase or corrupted backup ciphertext`).

### 1.3 Supabase Middleware & Client Layer
- **Network Failures during SSR:** `updateSession` catches and ignores network errors when Supabase credentials contain placeholder URLs (`try { await supabase.auth.getUser(); } catch {}`).

---

## 2. Weaknesses & Gaps

1. **Global Error Boundary:** Root [`app/error.tsx`](file:///d:/social/app/error.tsx) is a minimal fallback template without error reporting or state recovery.
2. **Realtime Reconnection Logic:** Supabase Realtime subscriptions lack automatic backoff and retry handlers.
3. **API Route Fallbacks:** Next.js route handlers in `app/api/` return standard 200 responses with `{}` rather than proper 404 or 501 HTTP status codes.
