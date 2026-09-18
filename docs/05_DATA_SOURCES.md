# 05_DATA_SOURCES.md — Data Sources Specification

This document details all data sources, persistence engines, caching layers, and external service contracts utilized by the **Private Chat** application.

---

## 1. Primary Data Sources & Storage Matrix

| Data Source | Type | Storage Engine | Location / Config | Auth & Access Controls |
|---|---|---|---|---|
| **Supabase PostgreSQL** | Relational DB | PostgreSQL 15+ | `NEXT_PUBLIC_SUPABASE_URL` | RLS Policies (`auth.uid()`) + RPC Service Role |
| **Supabase Storage** | Object Store | S3-compatible Private Bucket | Bucket `attachments` | Private bucket, path-scoped policy (`{user_id}/*`) |
| **IndexedDB (Browser)** | Client Storage | Browser Storage API | Local `SignalKeyStore` | Client-only, non-exportable private key store |
| **Environment Config** | Environment Vars | Next.js Server & Client Env | `.env.local` / `.env.example` | Public keys prefixed with `NEXT_PUBLIC_` |

---

## 2. Supabase PostgreSQL Operations

- **Read Operations:** Executed by authenticated clients using `@supabase/ssr` or `@supabase/supabase-js`. RLS restricts message reads to conversation members (`is_conversation_member(conversation_id)`).
- **Write Operations:** Messages and reactions inserted directly via authenticated client session.
- **RPC Stored Functions:** `consume_invite` RPC is restricted exclusively to `service_role` execution.

---

## 3. Supabase Storage ('attachments')

- **Bucket Property:** `public: false` (Private bucket).
- **Access Policy:**
  - Owner Insert/Select: Uploads placed under folder `{user_id}/{attachment_id}`.
  - Encryption Requirement: Files are encrypted with AES-256-GCM before upload. The storage bucket receives only encrypted byte buffers. Decryption keys never touch Supabase Storage.

---

## 4. IndexedDB Client Key Store

- **Location:** Managed via [`crypto/storage/keyStorage.ts`](file:///d:/social/crypto/storage/keyStorage.ts).
- **Data Held:** Local identity key pair, signed prekeys, one-time prekeys, active 1-to-1 Signal session records, and group SenderKey records.
- **Security:** Private keys reside strictly within client memory and IndexedDB. They are never sent across the network.
