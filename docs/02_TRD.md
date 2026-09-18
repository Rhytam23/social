# 02_TRD.md — Technical Requirements Document

This Technical Requirements Document specifies the runtime environment, frameworks, dependencies, build system, and platform bounds of the **Private Chat** codebase.

---

## 1. Core Technology Stack & Versions

| Layer / Technology | Component / Library | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `^15.1.0` | Server-Side Rendering, API Routes, Middleware |
| **UI Library** | React & React DOM | `^19.0.0` | UI Component rendering |
| **Language** | TypeScript | `^5.0.0` | Strict type system |
| **Styling** | Tailwind CSS | `^3.4.0` | Utility-first styling |
| **PostCSS** | Autoprefixer / PostCSS | `^10.5.4` / `^8.0.0` | CSS transformations |
| **Database & Auth** | Supabase JS & SSR | `^2.49.1` / `^0.5.2` | DB client, auth cookies, storage |
| **Cryptography Core** | `@signalapp/libsignal-client` | `^0.102.0` | Signal E2EE protocol engine (WASM/Native) |
| **Key Derivation** | `hash-wasm` | `^4.12.0` | Argon2id key derivation for key backup |
| **Crypto Utility** | `libsodium-wrappers` | `^0.8.4` | Low-level cryptographic primitives |
| **Test Runner** | Vitest | `^3.0.7` | Unit and security integration testing |
| **TypeScript Execution** | `tsx` | `^4.19.3` | Direct TS script execution |

---

## 2. Frontend Architecture Requirements

- **App Router Structure:** Uses Next.js App Router located in [`app/`](file:///d:/social/app).
  - Auth routes: `app/(auth)/login`, `app/(auth)/register`, `app/(auth)/invite`, etc.
  - Chat routes: `app/(chat)/chat`, `app/(chat)/groups`, `app/(chat)/people`, `app/(chat)/settings`.
  - Admin routes: `app/admin/users`, `app/admin/invites`, `app/admin/groups`.
- **State Management:** Local React component state (`useState`, `useContext`) with persistent client key state stored in IndexedDB ([`crypto/storage/keyStorage.ts`](file:///d:/social/crypto/storage/keyStorage.ts)).
- **Icons & UI:** Custom SVG icon set ([`components/ui/icons.tsx`](file:///d:/social/components/ui/icons.tsx)) and modular UI components (`button`, `dialog`, `badge`, `input`).

---

## 3. Backend & Database Architecture

- **Database System:** PostgreSQL managed via Supabase.
- **Security Enforcement:** Database Row Level Security (RLS) policies ([`database/migrations/002_rls_policies.sql`](file:///d:/social/database/migrations/002_rls_policies.sql) & [`003_security_foundation.sql`](file:///d:/social/database/migrations/003_security_foundation.sql)).
- **Atomic Operations:** Stored procedures with `SECURITY DEFINER` and `FOR UPDATE` row locking ([`database/functions/atomic_invite_consumption.sql`](file:///d:/social/database/functions/atomic_invite_consumption.sql)).

---

## 4. Cryptographic Specification & Key Hierarchy

1. **Identity Keys:** 32-byte Ed25519 identity key pairs generated via `IdentityKeyPair.generate()`.
2. **Prekeys & Signed Prekeys:** Signal protocol prekeys signed by the identity private key.
3. **Post-Quantum Kyber Prekeys:** Kyber KEM key pairs (`KEMKeyPair`) generated and signed for quantum resistance.
4. **Group Sender Keys:** `SenderKeyDistributionMessage` distributed via 1-to-1 Signal channels.
5. **Attachment Encryption:** Client-side AES-256-GCM encryption using Web Crypto API (`crypto.subtle`).
6. **Key Backup:** Exported key store JSON encrypted with AES-256-GCM using Argon2id-derived keys (Memory: 64MB, Parallelism: 4, Iterations: 3).

---

## 5. Build, Lint & Test Commands

- `npm run dev`: Launch Next.js development server.
- `npm run build`: Compile Next.js production bundle.
- `npm run lint`: Run Next.js ESLint validation.
- `npm run test`: Run Vitest unit & security test suite.
- `npx tsc --noEmit`: Execute TypeScript type checking without emitting files.
