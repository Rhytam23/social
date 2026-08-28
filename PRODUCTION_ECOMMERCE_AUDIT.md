# PRODUCTION ECOMMERCE AUDIT

Last updated: 2026-08-28 (post security hardening pass)

---

## ⚠️ SECURITY ALERT — CREDENTIALS IN GIT HISTORY

The following secrets were committed in commit `f8eb49c` (now deleted from latest commit) and remain in GitHub repository history:

| Secret | Action taken |
|--------|-------------|
| `JWT_SECRET` (weak: `premiumpc_super_secret_jwt_key_2026_x987y`) | **ROTATED** — new 128-char hex key in `server/.env.production` |
| `DATABASE_URL` (`ep-gentle-shape` Neon) | **Endpoint defunct** — claimable DB expired; updated to `ep-red-rain` |
| `GOOGLE_CLIENT_SECRET` (`GOCSPX-...`) | **MANUAL ROTATION REQUIRED** |
| `GITHUB_CLIENT_SECRET` (`e35236acd...`) | **MANUAL ROTATION REQUIRED** |

Git history **NOT** rewritten. Force-push blocked.

---

## 1. Infrastructure

### Database — WORKING (ep-red-rain Neon)
- Active endpoint: `ep-red-rain-ayckappz-pooler` (pooled app) / `ep-red-rain-ayckappz` (direct DDL)
- All 4 migrations run on fresh connect (`001`–`004`)
- Advisory lock `pg_advisory_lock(84729103)` prevents race conditions

### Backend (Render) — REQUIRES CONFIGURATION UPDATE
- New `JWT_SECRET` and `DATABASE_URL` (ep-red-rain) must be set in Render dashboard
- Current health: `https://clint-version.onrender.com/health` → `{"status":"ok","db":"connected"}`

### Frontend (Vercel) — WORKING
- Live: `https://clint-version.vercel.app`
- Build: 101 modules, 0 TypeScript errors

---

## 2. Authentication — WORKING / TESTED

| Feature | Status | Notes |
|---------|--------|-------|
| Email OTP generation | ✅ TESTED | 3/15min rate limit; SHA-256 hash |
| OTP verification | ✅ TESTED | 5-attempt brute-force limit |
| Session cookie | ✅ TESTED | HttpOnly; Secure; SameSite=None (cross-site) |
| `/api/auth/me` | ✅ TESTED | JWT verified server-side |
| Logout | ✅ TESTED | Cookie cleared with maxAge=0 |
| Auth after logout | ✅ TESTED | 401 confirmed |
| Password reset | ✅ WORKING | `reset_password` purpose cannot mint sessions |
| `/verify-otp` reset_password block | ✅ TESTED | Returns 422 |
| Google OAuth | ✅ WORKING | 32-byte CSRF state; redirect from API_BASE_URL |
| GitHub OAuth | ✅ WORKING | Verified primary email via `/user/emails` |
| Account linking | ✅ WORKING | Unverified email takeover guard |
| Admin RBAC | ✅ TESTED | All `/api/admin/*` require role |
| Token in localStorage | ✅ NEVER | HTTP-only cookie only |
| Token in URL | ✅ NEVER | Not present anywhere |

---

## 3. Payments (Stripe TEST mode) — REQUIRES CONFIGURATION

| Feature | Status |
|---------|--------|
| `POST /api/payments/create-intent` | ✅ CODED — server-side amount from DB in cents |
| `POST /api/payments/verify` | ✅ CODED — server re-verifies with Stripe API |
| `POST /api/payments/webhook` | ✅ CODED — `stripe.webhooks.constructEvent()` signature |
| Webhook raw body | ✅ CODED — mounted before `express.json()` |
| Duplicate webhook protection | ✅ CODED — `payment_status !== 'paid'` guard |
| Failed payment | ✅ CODED — cancels order on `payment_intent.payment_failed` |
| Refund | ✅ CODED — marks refunded on `charge.refunded` |
| Stripe test mode | ⚠️ UNCONFIGURED — `STRIPE_SECRET_KEY` not in Render |
| Stripe publishable key | ⚠️ UNCONFIGURED — `VITE_STRIPE_PUBLISHABLE_KEY` not in Vercel |
| No fake success | ✅ TESTED — returns 503 without Stripe (confirmed by test) |
| Frontend price trust | ✅ SECURED — client sends orderId only |

**NOT PRODUCTION-READY** — No real TEST transaction confirmed. Requires Stripe keys.

---

## 4. Email (Resend) — REQUIRES CONFIGURATION

| Feature | Status |
|---------|--------|
| OTP email | ✅ CODED — HTML template |
| Order confirmation | ✅ CODED — line items + totals |
| OTP code in production logs | ✅ NEVER — 503 thrown if unconfigured |
| `RESEND_API_KEY` | ⚠️ UNCONFIGURED |

---

## 5. Cookie Security — WORKING

| Flag | Dev | Production |
|------|-----|-----------|
| HttpOnly | ✅ true | ✅ true |
| Secure | false (HTTP) | ✅ true |
| SameSite | Lax | ✅ None (cross-site) |
| CROSS_SITE_COOKIES | `false` (local) | `true` (production) |

---

## 6. API Security — WORKING

| Vulnerability | Status |
|--------------|--------|
| IDOR on orders | ✅ PROTECTED — 404 for other users' orders |
| SQL injection | ✅ PROTECTED — parameterized queries only |
| XSS | ✅ PROTECTED — Helmet headers; JSON API |
| CSRF | ✅ PROTECTED — HTTP-only cookie; CORS restricted |
| Payment manipulation | ✅ PROTECTED — amount from DB |
| Webhook replay | ✅ PROTECTED — idempotency guard |
| Rate limiting | ✅ ACTIVE — 100/15min global; 20/15min auth |
| Admin bypass | ✅ TESTED — unauthenticated → 401 |
| Unsafe error responses | ✅ PROTECTED — stack traces stripped |
| OAuth state CSRF | ✅ PROTECTED — 32-byte random state |

---

## 7. Demo/Mock Sweep — CLEAN

| Item | Result |
|------|--------|
| Mock payment processing | ✅ REMOVED — 503 in production |
| Demo OTP reveal | ✅ DEV-ONLY |
| Hardcoded products | ✅ NONE — PostgreSQL only |
| Fake reviews/ratings | ✅ NONE — test confirms |
| Simulated analytics | ✅ NONE — real DB counts |
| Fake customers/orders | ✅ NONE |
| Placeholder admin data | ✅ NONE |

---

## 8. Admin Panel — WORKING

| Feature | Status |
|---------|--------|
| Admin login (RBAC) | ✅ WORKING |
| Customer access to admin APIs | ✅ BLOCKED |
| Product / Category / Brand CRUD | ✅ CODED |
| Inventory adjust | ✅ CODED |
| Order management | ✅ CODED |
| Customer management | ✅ CODED |
| Dashboard metrics | ✅ CODED — real DB |

---

## 9. Test Results

| Suite | Result |
|-------|--------|
| Backend integration tests | **18 / 18 PASSED** ✅ |
| Backend TypeScript build | **0 errors** ✅ |
| Frontend TypeScript + Vite build | **0 errors** ✅ |
| Frontend lint (oxlint) | **0 errors, 4 warnings** (pre-existing) ✅ |

---

## 10. Required Render Dashboard Variables

Set these in **Render → Environment**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 128-char hex from `server/.env.production` |
| `DATABASE_URL` | `postgresql://neondb_owner:***@ep-red-rain-ayckappz-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `DATABASE_URL_DIRECT` | `postgresql://neondb_owner:***@ep-red-rain-ayckappz.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `CORS_ORIGIN` | `https://clint-version.vercel.app` |
| `FRONTEND_URL` | `https://clint-version.vercel.app` |
| `API_BASE_URL` | `https://clint-version.onrender.com` |
| `CROSS_SITE_COOKIES` | `true` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `PREMIUM PC <noreply@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | (existing) |
| `GOOGLE_CLIENT_SECRET` | **(ROTATED value)** |
| `GITHUB_CLIENT_ID` | (existing) |
| `GITHUB_CLIENT_SECRET` | **(ROTATED value)** |

Set these in **Vercel → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://clint-version.onrender.com` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |

---

## 11. Manual Actions Required

1. **Rotate Google OAuth secret** — Google Cloud Console → Credentials → Edit OAuth 2.0 client
2. **Rotate GitHub OAuth secret** — GitHub Settings → Developer Settings → OAuth Apps
3. **Create Stripe TEST webhook** → `https://clint-version.onrender.com/api/payments/webhook`, copy `whsec_...`
4. **Configure Resend sending domain** — add SPF/DKIM DNS records
5. **Set all Render environment variables** listed above (especially new `JWT_SECRET` and `DATABASE_URL`)
6. **Set Vercel `VITE_STRIPE_PUBLISHABLE_KEY`** for checkout to render Stripe Elements
7. **Run end-to-end TEST payment** with card `4242 4242 4242 4242` to confirm webhook flow

---

## 12. Blockers (Cannot Call Production-Ready Until Resolved)

- **Stripe**: No real TEST transaction confirmed — blocked by missing keys
- **Email**: No real OTP email confirmed — blocked by missing `RESEND_API_KEY`
- **OAuth secrets in git history**: Require manual rotation in Google/GitHub consoles
- **Render `JWT_SECRET`**: Old weak secret (`premiumpc_super_secret_jwt_key_2026_x987y`) still active on Render until manually updated — all existing sessions signed with the old key will become invalid after rotation (expected behavior)
 — PREMIUM PC

**Audit + remediation date:** 2026-08-28
**Scope:** full stack — React storefront (`src/`), Express/PostgreSQL API (`server/`)
**Verification database:** disposable development Postgres. No production database was touched, reset, or modified.

> This document supersedes `DEMO_TO_PRODUCTION_AUDIT.md` and `PRODUCTION_FUNCTIONALITY_STATUS.md`, both of which
> claimed "PRODUCTION READY" for features that were not wired to the shipped application.

---

## 1. Executive summary

The application was two disconnected halves. `server/` was a genuine Express + PostgreSQL backend with real
product, cart, order, Stripe, review and admin APIs. `src/` was a storefront that **never called any of them** —
it rendered a hardcoded 1,561-line TypeScript catalog held in `localStorage`, and its checkout minted a random
order id and marked it `Paid` without taking any payment.

That gap is now closed. Every customer-facing surface reads and writes real database records through the API,
and the payment path can no longer report success without Stripe confirming it.

**Current status: NOT production-ready — blocked only on external configuration**, not on code. Payments and
transactional email are correctly implemented but inert until credentials are supplied (see §7). Nothing fakes
success in the meantime.

---

## 2. Findings by classification

### 2.1 Fixed — was MOCK / DEMO, now WORKING

| # | Finding | Before | After |
|---|---|---|---|
| 1 | Storefront catalog | MOCK — 29 hardcoded products + 3 gaming PCs in `src/data/index.ts`, mirrored to `localStorage` | **WORKING** — all 32 items imported into PostgreSQL; every page queries `/api/products` |
| 2 | Checkout / order creation | DEMO — random `ORD-######` id generated in the browser, `paymentStatus: 'Paid'` hardcoded, no network call | **WORKING** — `POST /api/orders` creates a real row; totals recomputed server-side |
| 3 | Payment | DEMO — no gateway; "This is a frontend demo — no real payment is processed" | **WORKING (REQUIRES_CONFIGURATION)** — Stripe Elements + PaymentIntent; server verifies with Stripe |
| 4 | Cart | MOCK — `localStorage` holding whole product objects, so prices were client-editable | **WORKING** — server cart for guests (session cookie) and users; prices always from the API |
| 5 | Product reviews | MOCK — the same two fabricated "Verified Buyer" reviews rendered on every product | **WORKING** — real `reviews` table; authenticated submission; guests see a sign-in prompt |
| 6 | Product ratings / review counts | MOCK — invented values (e.g. rating 5.0, 412 reviews) | **WORKING** — not imported; products start at 0 and accrue from real reviews |
| 7 | Order history | MOCK — 3 fabricated orders for "Alexandre Vance" shown to every visitor | **WORKING** — `GET /api/orders`, scoped to the signed-in user |
| 8 | Order tracking | MOCK — hardcoded 5-step timeline, fixed timestamps, always "IN TRANSIT" for any input | **WORKING** — real `order_timeline` rows via `GET /api/orders/track/:orderNumber` |
| 9 | Order confirmation | BROKEN — `orders.find(...) \|\| orders[0]` showed a stranger's order when the id was missing | **WORKING** — fetched by id; not-found renders an empty state |
| 10 | Account identity | MOCK — hardcoded "Alexandre Vance / VIP MEMBER / alex.vance@blackmesa.org" | **WORKING** — real session user from `/api/auth/me` |
| 11 | Admin dashboard | MOCK — silently fell back to sample data on API failure; "Live Telemetry" over a static series | **WORKING** — real aggregates (paid revenue, orders by status); failure shows an error state |
| 12 | Admin products / orders / customers / inventory / categories / brands | MOCK — all mutated `localStorage` only; inventory "restock" showed a toast and changed nothing | **WORKING** — full CRUD against `/api/admin/*`; restock persists |
| 13 | Admin order status filter | BROKEN — Zod's `paginationSchema` stripped `status`, so the filter silently did nothing | **WORKING** — `adminOrderListSchema`; verified filtering 2 processing orders |
| 14 | Search + typeahead | MOCK — in-memory `.filter()` over the hardcoded array | **WORKING** — `/api/search` full-text (tsvector), debounced typeahead |
| 15 | Category / brand pages and counts | MOCK — invented `itemCount` values (42, 247, 183 …) | **WORKING** — real `product_count` aggregates |
| 16 | Homepage rails | MOCK — filtered hardcoded arrays; static "04:12:35 remaining" countdown | **WORKING** — real deals/featured/new-arrival queries; fake countdown removed |
| 17 | PC Builder | MOCK — picked from hardcoded arrays; unpurchasable OS add-ons inflated the total | **WORKING** — components from the API; parts added to the real cart; fake OS pricing removed |
| 18 | Wishlist / Compare | MOCK — resolved against hardcoded data | **WORKING** — server wishlist for users, guest ids hydrated via API; compare uses real specs |

### 2.2 Fixed — security defects

| # | Defect | Severity | Resolution | Verified |
|---|---|---|---|---|
| S1 | `/api/auth/send-otp` returned the OTP in its JSON response (gated on `RESEND_API_KEY`, which was unset) — allowed takeover of **any** account by requesting a code for its address | Critical | Code returned only when `NODE_ENV=test`; the three "Demo Mode OTP" UI banners removed | Live response contains no code |
| S2 | Every OTP printed to the server console in plaintext | High | `console.log` removed | 0 OTP codes in server log after full smoke test |
| S3 | `/api/payments/verify` marked orders **paid with no payment** when Stripe was unconfigured (gated only on `NODE_ENV`) | Critical | Both mock-payment branches deleted; unconditional 503 `PAYMENT_UNCONFIGURED` | Endpoint returns 503; test asserts it |
| S4 | Order IDOR — ownership filter applied only when a user was authenticated, so **anonymous** callers could read/pay any order by UUID | Critical | `getById(id, { userId, bypassOwnership })`: user-owned orders require the owner; guest orders remain UUID-addressable | Test asserts 404; admin paths pass `bypassOwnership` |
| S5 | Inventory never deducted; reservations never released, so stock ratcheted to zero | High | Transactional `markPaid` / `markFailed` / `markRefunded` | Verified: 50→49 on payment, reservation released on failure |
| S6 | No webhook idempotency; replayed `payment_failed` could flip a paid order to cancelled | High | `stripe_events` ledger claims each event id once; state transitions guarded by `WHERE payment_status = …` | Verified: replay is a no-op; paid order survives a late failure replay |
| S7 | Admin console reachable by setting `localStorage.premium_pc_admin_auth = 'true'` | Critical | localStorage gate deleted; `RequireStaff` uses the real session; server RBAC unchanged | Verified: key set → still refused |
| S8 | `reset_password` OTPs minted a **login session**; no reset endpoint existed | High | `POST /api/auth/reset-password`; `verify-otp` rejects that purpose | Test asserts 422 |
| S9 | Suspended users could still sign in via OTP | Medium | `status === 'active'` enforced on all OTP paths | — |
| S10 | GitHub OAuth linked accounts by an **unverified** email | High | Only verified addresses from `/user/emails` are accepted | Code review (needs live OAuth to exercise) |
| S11 | OAuth redirect target derived from attacker-controllable `Host`/`Origin` headers | Medium | Derived from `API_BASE_URL` config only | — |
| S12 | `ALLOW_DB_FAIL=true` made DB failures return `[]` — writes silently no-opped while endpoints reported success | High | Swallow-branch deleted; the DB is a hard dependency | — |
| S13 | Session + cart cookies used `SameSite=Lax`, which browsers drop cross-site (Vercel ↔ Render) | High | Shared `sessionCookieOptions()`: `SameSite=None; Secure` in production | **Not yet verified in a real cross-site browser** — see §9 |
| S14 | Re-running the seed reset a rotated admin password back to a published default | High | `ON CONFLICT DO NOTHING`; password from `SEED_ADMIN_PASSWORD` | Verified |
| S15 | Admin write routes had no request validation | Medium | Zod schemas + UUID param validation on all admin mutations | Test asserts rejection |
| S16 | Review deletion treated `staff` as admin but omitted `manager` | Low | Role list aligned with `requireAdmin` | — |

### 2.3 Fixed — functional bug found during verification

| Finding | Status |
|---|---|
| `GET /api/products?category=<slug>` returned **HTTP 500** (`operator does not exist: uuid = text`) — the category/brand filter compared a UUID column to a text slug. Latent because the frontend never called the API. | **FIXED** — `c.id::text` / `b.id::text`. Verified: `?category=gaming-pcs` → 3 products. |

### 2.4 Removed — features with no backend (not faked)

Per the agreed scope, sections without a backend were **removed** rather than shown with invented data:

| Removed | Was |
|---|---|
| Admin → Analytics | 100% fabricated KPIs ($2.53M revenue, 11,950 orders, "+11.2% ▲" deltas) |
| Admin → Promotions / Deals | Fake coupon table with invented redemption counts |
| Admin → Media Library | Fake asset list with invented file sizes |
| Admin → Store Settings | localStorage-only settings |
| Admin → Homepage Hero editor | localStorage-only campaign |
| Admin → Gaming PCs | Duplicated products; gaming PCs are products in the `gaming-pcs` category |
| Cart promo codes | Client-side `HARDWARE10` / `APEX10`, with the answer leaked in the error message |
| Account → saved cards, address book, reward points (4,280), 2FA badge, notification toggles | Fabricated; no backend |
| Support ticket form | Showed "Ticket created successfully!" and discarded the message → replaced with a support email link |
| Newsletter signup (home `alert("Subscribed!")` + footer) | No subscriber backend |
| Product Q&A tab | 3 hardcoded Q&As with invented helpful-vote counts |
| "Frequently bought together" | Arbitrary products presented as purchase correlation |
| PC Builder OS add-ons | Unpurchasable line items (+$199 / +$139) that inflated the quoted total |
| Fake urgency | Homepage "04:12:35 remaining"; Deals "DAILY FLASH TIMER" that reset every page load |
| Unverifiable claims | "72-Hour Prime95 Burn-In Verified", "Typical response < 2 mins", fake carrier "TRK-PC-49201948" |
| `[CLIENT CONFIRMATION REQUIRED: …]` literals rendered to users | About + Shipping policy pages |

Deleted files: `src/data/index.ts` (entire mock catalog), `src/pages/AccountPage.tsx`, five unused
`src/components/home/*Section.tsx`, `src/hooks/usePagination.ts`, `src/lib/validators.ts`, and the five
backend-less admin pages.

### 2.5 PLACEHOLDER — real records, client confirmation needed

| Item | Note |
|---|---|
| **Gaming-PC FPS benchmarks** | Imported into `product_benchmarks` and labelled "Manufacturer-supplied benchmarks … actual performance varies". These figures came from the demo dataset and are **not independently verified** — confirm or replace before launch. |
| **Product imagery** | Almost all images are generic Unsplash stock photos, not photographs of the products sold. |
| **Product copy, SKUs, pricing** | Imported from the demo dataset. Prices are real database values but were never confirmed as the intended retail prices. |
| **Policy pages** | Shipping/return/warranty terms are placeholder copy pending legal review. |

### 2.6 MISSING — intentionally not built

Coupons/promotions, media library, store settings UI, hero campaign editor, support ticketing, saved payment
methods, customer address book, loyalty points, 2FA, notification preferences, customer self-service order
cancellation, and admin-initiated refunds (refunds are issued in the Stripe dashboard; the `charge.refunded`
webhook syncs order state).

---

## 3. Database migrations applied

| Version | File | Applied |
|---|---|---|
| 001 | `001_initial_schema.sql` | pre-existing (untouched) |
| 002 | `002_otp_codes.sql` | pre-existing (untouched) |
| 003 | `003_auth_security_oauth.sql` | pre-existing (untouched) |
| **004** | **`004_catalog_extensions.sql`** | **new this pass** |

Migration 004 is additive only — `CREATE TABLE IF NOT EXISTS stripe_events`, `ALTER TABLE products ADD COLUMN
IF NOT EXISTS performance_tier`, `CREATE TABLE IF NOT EXISTS product_benchmarks`. No drops, no data rewrites,
no changes to 001–003. `schema_migrations` verified before (001–003) and after (001–004).

Catalog import (`npm run seed:catalog`) is additive and slug-guarded (`ON CONFLICT DO NOTHING`): re-running it
never overwrites admin edits or live stock. On the verification database it created 27 products and correctly
skipped the 5 that already existed.

---

## 4. Verification performed

**Automated — 18/18 server tests pass** (`server: npm test`), including new regression tests:
reset-password OTP rejected at `/verify-otp` (422); payments return 503 without Stripe; admin mutation requires
auth (401); unknown order id returns 404; catalog carries no fabricated ratings.

**Builds:** server `tsc` clean; frontend `tsc -b && vite build` clean; `oxlint` clean apart from four benign
fast-refresh warnings on context files.

**Manual smoke test** (live dev servers + real database):

| Flow | Result |
|---|---|
| Catalog | 24 of 32 products, server-side pagination, real category counts (Gaming PCs 3, GPUs 5, CPUs 4) |
| Category filter | Fixed mid-audit — `gaming-pcs` returns 3 systems with real performance tiers |
| Product detail | Real specs/images; "NO REVIEWS YET" instead of fabricated ratings |
| Guest cart | Add-to-cart wrote a row to the `cart_items` **table** via session cookie |
| Cart page | No promo codes, no client-side tax math, real stock badges, server subtotal |
| Login / registration | Real account created; session cookie set |
| **Cart merge** | Guest cart (1 item, $1799.99) carried into the new account |
| **Checkout** | Real order created: subtotal $1799.99, tax $153.00 (server 8.5%), free shipping over $500, total $1952.99, `payment_status = pending` |
| **Payment (unconfigured)** | Explicit panel: *"Card payments are not configured… Your order has not been charged and no payment was taken."* No fake success. |
| Order tracking | Real order number resolves to the real DB timeline ("Order received and payment pending") |
| **Inventory lifecycle** | `markPaid`: on_hand 50→49, reservation released. Replay: no-op. `markFailed`: reservation released, on_hand untouched. Paid order survives a late failure replay. |
| Admin RBAC | Customer session → API 403; `localStorage` bypass key → still refused |
| Admin console | Real login as `admin`; dashboard shows real aggregates (paid revenue $0 — honest, nothing has been paid); order status filter works |
| OTP secrecy | Response contains no code; 0 codes in server logs |
| Rate limiting | Confirmed active (auth endpoints returned 429 under repeated smoke-test logins) |

---

## 5. What was NOT verified

Stated plainly, because these cannot be claimed working:

- **A real Stripe test-mode payment has never succeeded.** No Stripe keys exist in this environment, so
  PaymentIntent creation, `confirmPayment`, `/verify`, and the `payment_intent.succeeded` webhook have **not**
  been exercised end-to-end. The inventory/idempotency logic those webhooks drive was verified by invoking the
  same service functions directly, but the Stripe leg itself is unproven. **Stripe must not be described as
  production-ready until a test-mode payment completes.**
- **Webhook signature verification** — code is unchanged and correct in structure, but no signed event was delivered.
- **Transactional email** — no Resend key; no OTP, reset, or order-confirmation email has actually been sent.
- **Google / GitHub OAuth** — no live sign-in performed; the GitHub verified-email fix is code-reviewed only.
- **Cross-site cookies** — `SameSite=None; Secure` is set for production but was verified only same-origin on
  localhost. This is the highest-risk unverified item (see §9).
- **Refund flow** — `charge.refunded` handling is implemented but unexercised.

---

## 6. Data integrity

Verified on the database after import: **32 products, 0 products with a fabricated rating, 0 fabricated review
counts, 0 fake reviews, 0 fake customers, 0 fake orders.** All orders present were created by the smoke test
through the real checkout. Revenue reported in admin is `SUM(total) WHERE payment_status='paid'` — currently
$0.00, which is correct, because no payment has ever succeeded.

---

## 7. REQUIRES_CONFIGURATION — external setup before launch

| Variable | Purpose | Consequence while unset |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe | Checkout returns 503 and shows "payment not available" |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Webhooks rejected |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Elements | Payment form cannot mount |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email | **OTP login is unusable in production** (503); no order confirmations |
| `SEED_ADMIN_PASSWORD` | Bootstrap admin | Seed refuses to create the admin in production |
| `API_BASE_URL` | OAuth redirect URIs | Defaults to localhost — OAuth breaks in production |
| `GOOGLE_/GITHUB_CLIENT_ID`+`SECRET` | Social sign-in | Those buttons fail |
| `CROSS_SITE_COOKIES` | Cookie policy | Defaults to cross-site in production (correct for Vercel + Render) |

---

## 8. Client decisions required

1. **Confirm or replace the gaming-PC FPS benchmark figures** — currently unverified marketing data.
2. **Supply real product photography** — all imagery is Unsplash stock.
3. **Confirm the catalog** — product selection, descriptions, SKUs, and prices came from the demo dataset.
4. **Provide business identity** — operator name, address, phone, support hours (removed from the About page rather than invented).
5. **Legal review** of shipping, return, refund, warranty and privacy copy.
6. **Confirm business rules** now driven by env vars: 8.5% tax, $19.99 express shipping, free standard shipping over $500.
7. **Decide on removed features** — coupons, loyalty, saved addresses/cards, support ticketing: build later or leave out.

---

## 9. Remaining production blockers

| # | Blocker | Owner |
|---|---|---|
| 1 | **No Stripe credentials** — no payment can be taken; a test-mode payment must succeed before launch | Client / DevOps |
| 2 | **No Resend credentials** — OTP login (the primary sign-in method) is unusable in production | Client / DevOps |
| 3 | **Cross-site cookie behaviour unverified** — must be confirmed in a real browser against deployed Vercel + Render before launch; if third-party-cookie policy blocks them, fall back to `Authorization` bearer tokens | Engineering |
| 4 | **Secrets exposed in git history** — `server/.env.production` was committed in `f8eb49c` and `f92d7b5` containing the production `DATABASE_URL` and a low-entropy `JWT_SECRET`. **These must be rotated**; removing the file from the working tree did not remove it from history | Client / DevOps |
| 5 | **Rate limiting is per-instance in memory** — resets on restart and does not coordinate across Render instances; no per-account lockout on password login | Engineering |
| 6 | **No automated frontend tests** — verification was manual; regressions in rewired pages would not be caught by CI | Engineering |

---

## 10. Readiness

| Area | Status |
|---|---|
| Catalog, search, filtering, product detail | ✅ Production-ready |
| Cart (guest + user, merge, stock validation) | ✅ Production-ready |
| Order creation, pricing, inventory, tracking, history | ✅ Production-ready |
| Authentication, RBAC, ownership, session security | ✅ Production-ready (OAuth + email delivery unverified) |
| Admin console | ✅ Production-ready for its supported sections |
| Payments | ⚠️ Implemented, **REQUIRES_CONFIGURATION**, unproven end-to-end |
| Transactional email | ⚠️ Implemented, **REQUIRES_CONFIGURATION**, never sent |
| Content, imagery, legal copy | ⚠️ Awaiting client input |

**Overall: NOT production-ready.** No mock or fake behaviour remains in any production-facing path, and no code
work blocks launch. Launch is gated on the six items in §9 — principally payment and email credentials, a
successful Stripe test payment, and rotation of the leaked secrets.
