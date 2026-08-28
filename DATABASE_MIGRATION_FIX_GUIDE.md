# PREMIUM PC — Database Migration Architecture & Fix Guide

This master specification details the root cause analysis, current migration architecture, required code changes, Render/Neon configuration settings, and production verification procedures for database schema migrations.

---

## 1. Root Cause Analysis

The error `relation "users" does not exist` occurred in production due to three architectural gaps:

1. **Swallowed Migration Failure on Boot**: In `server/src/index.ts`, `await runMigrations()` was wrapped in a `try ... catch` block that logged a warning but allowed the Express server to call `app.listen()` and accept HTTP traffic even if migrations failed or were skipped due to missing credentials.
2. **Missing `DATABASE_URL_DIRECT` Connection Handling**: Neon Cloud PostgreSQL uses a pooled connection string (`-pooler.aws.neon.tech`) for `DATABASE_URL`, which is optimized for runtime queries but incompatible with multi-statement DDL transactions and advisory locks. Without `DATABASE_URL_DIRECT` set in Render, migrations either failed silently or skipped.
3. **Lack of Migration Advisory Locks**: The migration runner lacked a PostgreSQL advisory lock (`pg_advisory_lock`), creating race condition risks if Render launched multiple web service instances during a deployment.

---

## 2. Current Migration Architecture

### 2.1 File Directory
All DDL schema migrations reside in `server/src/db/migrations/`:
- `001_initial_schema.sql`: Creates `users`, `categories`, `brands`, `products`, `product_images`, `product_specs`, `product_tags`, `inventory`, `carts`, `cart_items`, `orders`, `order_items`, `order_timeline`, `wishlist_items`, `reviews`, and `schema_migrations` table.
- `002_otp_codes.sql`: Creates `otp_codes` table for 6-digit email authentication.
- `003_auth_security_oauth.sql`: Safely alters `users` (adds `google_id`, `github_id`) and `otp_codes` (adds `code_hash`, `attempts`, `max_attempts`).

### 2.2 Execution Order & Idempotency
- **Order**: Lexicographical file sorting (`001` ➔ `002` ➔ `003`).
- **Tracking**: `schema_migrations` table records applied version numbers (`001`, `002`, `003`).
- **Idempotency**: All DDL statements use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`.
- **Transactions**: Each migration file executes inside `BEGIN ... COMMIT` with `ROLLBACK` on error.

---

## 3. Exact Files Involved

1. [`server/src/index.ts`](file:///e:/projesct01/server/src/index.ts): Startup sequence orchestrator.
2. [`server/src/db/migrate.ts`](file:///e:/projesct01/server/src/db/migrate.ts): Migration runner script.
3. [`server/src/db/client.ts`](file:///e:/projesct01/server/src/db/client.ts): Application PostgreSQL pool connection client.
4. [`server/package.json`](file:///e:/projesct01/server/package.json): Build & migration npm scripts.

---

## 4. Exact Changes Required

### Change 1: Strict Migration Failure Enforcement in `server/src/index.ts`
Modify `start()` in `server/src/index.ts` so that if `runMigrations()` throws an error, the server logs a fatal error and terminates immediately with `process.exit(1)`. The server **must never** open HTTP port `10000` / `3001` if schema migrations have failed.

```ts
// Enforce strict startup sequence:
// 1. Check DB Connection
// 2. Run Pending Migrations
// 3. Fail fast on error
// 4. Start Express Server
console.log('[Server] Running database migrations...')
await runMigrations()
console.log('[Server] Migrations verified successfully.')
```

### Change 2: PostgreSQL Advisory Lock & Connection Validation in `server/src/db/migrate.ts`
Add `pg_advisory_lock(84729103)` at the start of `runMigrations()` and release it in a `finally` block (`pg_advisory_unlock(84729103)`). This prevents multi-instance deployment race conditions on Render.

---

## 5. Why Each Change Is Necessary

- **Strict Failure Exit (`process.exit(1)`)**: Prevents the backend from serving broken HTTP 500 errors to customers when database tables are missing.
- **PostgreSQL Advisory Lock**: Ensures that when Render deploys a new build alongside a running instance, only one instance executes DDL migrations at a time.
- **`DATABASE_URL_DIRECT` Enforcement**: Bypasses connection poolers (`PgBouncer`/Neon pooler) for DDL execution, ensuring transactional stability.

---

## 6. Required Render Configuration

In the Render Web Service dashboard (**Render Dashboard ➔ Service ➔ Environment Variables**):

| Environment Variable | Description / Required Format |
| :--- | :--- |
| **`DATABASE_URL`** | Pooled Neon PostgreSQL URL (e.g. `postgresql://user:pass@ep-xyz-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require`) |
| **`DATABASE_URL_DIRECT`** | Direct Neon PostgreSQL URL without `-pooler` (e.g. `postgresql://user:pass@ep-xyz.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require`) |
| **`NODE_ENV`** | `production` |
| **`JWT_SECRET`** | 64-character random hex string |

### Render Build & Start Commands
- **Root Directory**: `server` (or repository root with `npm run build:server`)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js` (or `npm run server:migrate && node dist/index.js`)

---

## 7. Required Neon Configuration

1. In [console.neon.tech](https://console.neon.tech), navigate to **Dashboard ➔ Connection Details**.
2. Copy the **Pooled** connection string ➔ Set as `DATABASE_URL` in Render.
3. Toggle to **Direct** connection string ➔ Set as `DATABASE_URL_DIRECT` in Render.

---

## 8. Safe Migration & Rollback Procedures

### Safe Migration Procedure
1. Deploy updated code to Render.
2. Render executes `npm install && npm run build`.
3. Render starts `node dist/index.js`.
4. `start()` connects to Neon PostgreSQL using `DATABASE_URL_DIRECT`.
5. Migration runner acquires advisory lock `84729103`.
6. Checks `schema_migrations` table.
7. Executes unapplied migrations (`001` ➔ `002` ➔ `003`) in individual transactions.
8. Records version numbers in `schema_migrations`.
9. Releases advisory lock.
10. Express server starts and accepts traffic.

### Rollback Considerations
- All migration DDL statements use non-destructive operations (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- Data is never truncated or dropped during migrations.
- If a migration fails, PostgreSQL automatically rolls back that specific file's transaction, leaving existing tables intact.

---

## 9. Local Verification Commands

Run locally from project root:

```bash
# 1. Build backend TypeScript
npm run build:server

# 2. Run backend test suite
npm run test:server

# 3. Build frontend SPA
npm run build
```
