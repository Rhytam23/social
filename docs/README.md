# Private Chat — Master Engineering Documentation

Welcome to the comprehensive engineering documentation set for the **Private Chat** application. This directory contains detailed specifications, architecture documents, security audits, database schemas, and AI agent guidelines derived directly from empirical analysis of the codebase.

---

## 🗺️ Documentation Sitemap & Recommended Reading Order

For developers, security auditors, or AI coding agents onboarding to this project, read the documentation in the following order:

| File | Document Name | Description | Key Focus Area |
|---|---|---|---|
| [`00_MASTER_RULES.md`](./00_MASTER_RULES.md) | Master Governance Rules | Architectural constraints, source-of-truth rules, forbidden shortcuts, security rules | Governance |
| [`01_PRD.md`](./01_PRD.md) | Product Requirements Document | Implemented, partially implemented, and planned feature sets | Product & Use Cases |
| [`02_TRD.md`](./02_TRD.md) | Technical Requirements Document | Frameworks, library versions, dependencies, and platform bounds | Tech Stack |
| [`03_ARCHITECTURE.md`](./03_ARCHITECTURE.md) | System Architecture & Diagrams | High-level system architecture and 7 Mermaid diagrams | Architecture |
| [`04_DATA_MODEL.md`](./04_DATA_MODEL.md) | Database & Data Model | PostgreSQL tables, RLS, indexes, constraints, ER diagram, client structures | Data Model |
| [`05_DATA_SOURCES.md`](./05_DATA_SOURCES.md) | Data Sources Specification | Supabase DB, Storage bucket, IndexedDB key store, environment config | Data Infrastructure |
| [`06_SCRAPING_SPEC.md`](./06_SCRAPING_SPEC.md) | Scraping & Ingestion Spec | Explicit specification confirming no scraping mechanisms exist | Scraping Audit |
| [`07_API_CONTRACT.md`](./07_API_CONTRACT.md) | API Contract Specification | Next.js API route handlers, RPCs, parameters, and status codes | API Reference |
| [`08_UI_SPEC.md`](./08_UI_SPEC.md) | Current UI & Design Tokens | Layout shell, component trees, state behaviors, Tailwind design tokens | UI Baseline |
| [`09_ERROR_HANDLING.md`](./09_ERROR_HANDLING.md) | Error Handling Strategy | Frontend, API, database, and E2EE exception handling behaviors | Resilience |
| [`10_SECURITY.md`](./10_SECURITY.md) | Security Audit & Threat Model | Auth, RLS, E2EE, secret isolation, rate-limiting, vulnerabilities | Security Audit |
| [`11_ADMOB_SPEC.md`](./11_ADMOB_SPEC.md) | AdMob & Advertising Spec | Explicit specification confirming no AdMob/Ad integration exists | Ad Integration |
| [`12_GITHUB_ACTIONS.md`](./12_GITHUB_ACTIONS.md) | CI/CD & GitHub Actions Spec | Explicit specification documenting current CI/CD status | DevOps / CI |
| [`13_TESTING.md`](./13_TESTING.md) | Testing Specification | Vitest test suite analysis (E2EE Signal, authorization, invite tests) | Testing & QA |
| [`14_PRODUCTION_CHECKLIST.md`](./14_PRODUCTION_CHECKLIST.md) | Production Readiness Checklist | Verification matrix across 18 operational pillars | Launch Readiness |
| [`15_MICROTASKS.md`](./15_MICROTASKS.md) | Prioritized Task Breakdown | P0-P3 task backlog for security, bugs, features, and QA | Backlog |
| [`16_CHANGELOG.md`](./16_CHANGELOG.md) | Version History & Changelog | Historical record of baseline initial release and security foundation | Release History |
| [`17_DECISIONS.md`](./17_DECISIONS.md) | Architecture Decision Records | Recorded ADRs (Next.js App Router, Supabase RLS, Signal Protocol E2EE) | ADRs |
| [`18_COMPONENT_CATALOG.md`](./18_COMPONENT_CATALOG.md) | React Component Inventory | Detailed catalog of UI components, props, state, and dependencies | Component Tree |
| [`19_DATABASE_SECURITY.md`](./19_DATABASE_SECURITY.md) | Database Security Audit | In-depth audit of RLS policies, triggers, and RPC security definers | DB Security |
| [`20_E2EE_SPEC.md`](./20_E2EE_SPEC.md) | End-to-End Encryption Specification | Technical spec of libsignal-client integration, key store, ratchets, group keys | E2EE Cryptography |
| [`21_ENVIRONMENT.md`](./21_ENVIRONMENT.md) | Environment Configuration | Required/optional variables, secret classifications, defaults | Configuration |
| [`22_DEPLOYMENT.md`](./22_DEPLOYMENT.md) | Deployment & Operations Guide | Build procedures, Supabase setup, migrations execution, domain configuration | Operations |
| [`23_TROUBLESHOOTING.md`](./23_TROUBLESHOOTING.md) | Troubleshooting & FAQ | Diagnostic workflows for local setup, build errors, WASM issues, DB sync | Diagnostics |
| [`24_CHANGE_IMPACT.md`](./24_CHANGE_IMPACT.md) | Change Impact Matrix | Ripple-effect breakdown when modifying auth, E2EE, RLS, or schema | Safety Guide |
| [`25_AI_AGENT_GUIDE.md`](./25_AI_AGENT_GUIDE.md) | AI Agent Operating Guide | Mandatory inspect-plan-execute workflow for AI coding assistants | Agent Protocols |
| [`26_PRODUCTION_CONFIGURATION.md`](./26_PRODUCTION_CONFIGURATION.md) | Production Setup & Credential Guide | Definitive setup reference, env vars, Supabase setup, integration sequence | Launch Config |
| [`27_PUBLIC_RELEASE_AUDIT.md`](./27_PUBLIC_RELEASE_AUDIT.md) | Final Public Release Audit Report | Release decision, 100-user capacity, threat model, P0/P1 issues, smoke tests | Release Audit |
| [`API.md`](./API.md) | External API & Services Setup Guide | Service credentials procurement, Supabase setup, environment variable guidance | Services Setup |
| [`check.md`](./check.md) | Final Security & Audit Check Log | Security checks performed, automatic fixes applied, GitHub readiness | Audit Log |

---

## 📊 Project Status & Implementation Overview

- **Current Version:** `0.1.0` (Pre-production baseline)
- **Core Stack:** Next.js `15.1.0` (App Router), React `19.0.0`, TypeScript `5.0.0`, Tailwind CSS `3.4.0`
- **Database & Auth:** Supabase PostgreSQL with 4 SQL migrations (`001` through `004`) + atomic invite RPC function
- **Cryptography Engine:** Client-side E2EE powered by `@signalapp/libsignal-client` (`^0.102.0`), `hash-wasm` (Argon2id KDF), and Web Crypto API (AES-256-GCM attachment encryption)
- **Testing Suite:** Vitest unit & static SQL security test suite under `/tests`

---

## 🚨 Known Critical Issues & Vulnerability Findings

1. **Middleware Admin Check Discrepancy (P0 Security Issue):**
   - [`middleware.ts`](file:///d:/social/middleware.ts#L40) evaluates admin status via `user.app_metadata?.is_admin === true`, whereas SQL migration [`003_security_foundation.sql`](file:///d:/social/database/migrations/003_security_foundation.sql#L33) explicitly mandates deriving `is_admin` strictly from `public.profiles.is_admin`.
2. **Placeholder Next.js API Route Handlers:**
   - Routes under [`app/api/`](file:///d:/social/app/api) currently return static dummy JSON (`{}`). API interactions in the prototype client page rely on mock state.
3. **Web Worker Offloading for Signal WASM:**
   - Cryptographic operations in `@signalapp/libsignal-client` run synchronously on the UI main thread rather than inside Web Workers.

---

## 🚀 Production Readiness Summary

- **Overall Status:** **`[ ] NOT PRODUCTION READY (PROTOTYPE / BASELINE)`**
- **Database RLS:** `[x] Verified` (Tight row-level security enabled across 10 tables)
- **E2EE Core Cryptography:** `[x] Verified` (Passed full 1-to-1, group key rotation, attachment encryption, and key backup test suites)
- **Authentication Routes & Edge Middleware:** `[ ] Pending production integration`
