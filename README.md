# PRIVATE-CHAT

PRIVATE-CHAT is an end-to-end encrypted (E2EE), privacy-first messaging web application built with Next.js 15, TypeScript, Tailwind CSS, Supabase, and the Signal Protocol (`@signalapp/libsignal-client`).

---

## 1. Core V1 Functionality

- **Familiar 2-Pane Messaging Interface**: Fast, dense, responsive layout (WhatsApp / Telegram ergonomics) with collapsible slide-over security details.
- **End-to-End Encryption (E2EE)**:
  - **1-to-1 Messaging**: Signal Double Ratchet protocol with Curve25519, HKDF, and AES-256.
  - **Group Messaging**: Signal Sender Keys protocol.
  - **Attachments**: Client-side 256-bit AES-GCM encryption before upload to private storage.
  - **Key Backup**: Argon2id KDF key derivation + AES-GCM passphrase-protected backup.
- **Rich Message Interactions**: Quoted replies, emoji reactions, message editing, soft-deletion, attachments, and voice notes.
- **Conversations & Groups**: Direct chat initiation and group creation modal with equal membership.
- **Two Operating Modes**:
  - **Local Demo Mode**: Instant 1-click persona switching (Alice Vance, Bob Miller, Carol Danvers, David Wright) with multi-tab `BroadcastChannel` real-time sync.
  - **Production Mode**: Full Supabase cloud-backed authentication, PostgreSQL Row Level Security (RLS), Supabase Realtime, and private storage buckets.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  Next.js 15 (App Router) + React 19 + Tailwind CSS          │
│  Autoritative ChatStore + useSyncExternalStore Hook        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Local Synchronization   │ │      Cryptographic Engine  │
│  BroadcastChannel Multi-Tab  │ │  @signalapp/libsignal-client│
│  localStorage Cache          │ │  Argon2id + AES-GCM 256    │
└──────────────┬───────────────┘ └─────────────┬──────────────┘
               │                               │
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
│  PostgreSQL 15 (Row Level Security + Escalation Triggers)   │
│  Supabase Realtime (Postgres Change Feeds)                  │
│  Private Supabase Storage (encrypted_attachments)          │
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

---

## 4. Development & Testing Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Run unit, integration, and security test suites (66 tests)
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

1. See [`docs/DEPLOYMENT.md`](file:///d:/social/docs/DEPLOYMENT.md) for full step-by-step instructions on creating a Supabase project, executing database migrations (`database/migrations/*.sql`), creating the private `encrypted_attachments` storage bucket, and configuring production environment variables.
2. Review [`docs/DEPLOYMENT_CHECKLIST.md`](file:///d:/social/docs/DEPLOYMENT_CHECKLIST.md) before promoting to production.

---

## 6. Current Limitations & Considerations

- **Live Cloud Messaging**: Requires provisioning a live Supabase project and setting valid credentials in `.env.local`. When unconfigured, the application runs seamlessly in local demo mode with isolated multi-user personas and `BroadcastChannel` multi-tab sync.
- **Dependencies**: `npm audit` identifies 4 dev-only vulnerabilities (`@vitest/mocker` and internal Next.js dev `postcss`); zero production runtime vulnerabilities exist.
