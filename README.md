# PRIVATE-CHAT

PRIVATE-CHAT is an end-to-end encrypted (E2EE), invite-only messaging web application built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

> **Note on cryptography**: earlier revisions of this project specified the Signal Protocol via `@signalapp/libsignal-client`. That package ships only native Node.js addons (per-OS `.node` binaries) - it cannot be loaded by a web page at all, only by a Node.js process or an Electron app. Running it server-side would mean the server sees plaintext before encrypting, defeating E2EE entirely. V1 replaces it with [`libsodium-wrappers`](https://github.com/jedisct1/libsodium.js) (WASM, runs identically in the browser and in tests): X25519 key exchange with XSalsa20-Poly1305 authenticated encryption for 1:1 messages, a per-group symmetric key (also XSalsa20-Poly1305) distributed to each member via sealed public-key boxes for groups, WebCrypto AES-256-GCM for attachments, and Argon2id (via `hash-wasm`) + AES-GCM for passphrase-protected key backups. See `docs/V1_STATUS.md` for the full rationale and what was audited/fixed.

---

## 1. Core V1 Functionality

- **Familiar 2-Pane Messaging Interface**: Fast, dense, responsive layout (WhatsApp / Telegram ergonomics) with collapsible slide-over security details.
- **End-to-End Encryption (E2EE)**, all client-side via `crypto/` (libsodium):
  - **1-to-1 Messaging**: X25519 + XSalsa20-Poly1305 authenticated encryption.
  - **Group Messaging**: per-group symmetric key, sealed-box distributed per member device, rotated on membership change.
  - **Attachments & voice notes**: client-side 256-bit AES-GCM encryption before upload to a private Supabase Storage bucket; downloaded ciphertext is decrypted client-side on demand.
  - **Key Backup**: Argon2id-derived key + AES-GCM passphrase-protected export/import of the device identity key.
- **Rich Message Interactions**: Quoted replies, emoji reactions, message editing, soft-deletion, attachments, and voice notes - all persisted to Postgres via Supabase, not local-only.
- **Conversations & Groups**: Direct chat initiation, group creation, and real add/remove-member management with group key rotation.
- **Invite-only registration**: enforced server-side by a Postgres trigger on `auth.users` (see `database/migrations/006_production_hardening.sql`), not just client-side UI - a request that bypasses the UI entirely still can't create an account without a valid invite.
- **Two Operating Modes**:
  - **Local Demo Mode**: dev-only (`NODE_ENV !== 'production'`) preview with seeded personas and `BroadcastChannel` multi-tab sync. Cannot activate in a production build even if Supabase env vars are missing - middleware fails closed (HTTP 500) instead.
  - **Production Mode**: Supabase-authoritative - Postgres + RLS, Supabase Realtime, private storage buckets.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  Next.js 15 (App Router) + React 19 + Tailwind CSS          │
│  ChatStore (useSyncExternalStore) + MessagingCrypto session │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Local view-state cache     │ │   Cryptographic Engine     │
│   (pin/mute/archive prefs)   │ │   libsodium-wrappers (WASM)│
│   localStorage, per viewer   │ │   WebCrypto AES-GCM         │
└──────────────┬───────────────┘ │   Argon2id (hash-wasm)     │
               │                 └─────────────┬──────────────┘
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Hardened API Layer (/api/*)                  │
│  Next.js Route Handlers + Sliding-Window Rate Limiter       │
│  IDOR Conversation Membership Guards + Cookie SSR Auth      │
└──────────────────────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Cloud Backend                    │
│  PostgreSQL 15 (Row Level Security + invite-gated signup)   │
│  Supabase Realtime (Postgres Change Feeds)                  │
│  Private Storage (encrypted_attachments) + public avatars   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Configuration

Copy the example file:
```bash
cp .env.example .env.local
```

### Production Variables (`.env.local`)
```env
# Public Supabase Client (Exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Server-Only Supabase Admin (CRITICAL SECRET - NEVER PREFIX WITH NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Distributed Rate Limiting (Optional - Upstash Redis for multi-instance deployments)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security policies and is used strictly in server-side handlers (`lib/supabase/admin.ts`). **NEVER expose this key to the browser or prefix it with `NEXT_PUBLIC_`.**

Run every file in `database/migrations/` in order (001 through 006) against your Supabase project before first use.

---

## 4. Development & Testing Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Run unit, integration, and security test suites
npm test

# Typecheck with TypeScript
npx tsc --noEmit

# Run ESLint
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 5. Deployment Guide

1. Create a Supabase project and run every migration in `database/migrations/` (001 through 006) in order.
2. Set the environment variables above.
3. See `docs/V1_STATUS.md` for what has and hasn't been verified against a live Supabase project - this repository's sandbox had no Docker and no live Supabase project available, so migrations 006 and the full signup/messaging/RLS path are unverified against real Postgres. Test them yourself before going live.

---

## 6. Current Limitations & Considerations

- **Live Cloud Messaging**: Requires provisioning a live Supabase project and running all migrations. Local demo mode (dev-only) never substitutes for this in production.
- See `docs/V1_STATUS.md` for the full list of what was audited, fixed, tested, and what remains unverified.
