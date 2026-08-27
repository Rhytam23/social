# PREMIUM PC — Complete Production Setup & Deployment Guide

This guide provides end-to-end instructions for deploying the **PREMIUM PC** e-commerce platform from the current repository state to a live, production-grade cloud environment.

---

## 1. Project Architecture

```text
[ Web Browser / Mobile Device ]
              │
              ▼
[ Frontend SPA (React 19 + Vite) ] ── (Hosted on Vercel / Netlify)
              │
              │ HTTPS REST API requests (JSON + Auth Cookies / JWT)
              ▼
[ Backend API (Node.js + Express + TS) ] ── (Hosted on Render / Railway)
              │
              ├───────────────────────────────────┐
              ▼                                   ▼
[ Database (Neon Serverless PostgreSQL) ]    [ External Cloud Services ]
  • Connection Pooling (-pooler)               • Media Storage (Cloudinary/S3) [IMPLEMENTATION REQUIRED]
  • GIN Full-Text Search Indexes              • Payment Gateway (Razorpay/Stripe) [IMPLEMENTATION REQUIRED]
  • Relational Schema (13 Tables)              • Transactional Email (Resend/SendGrid) [IMPLEMENTATION REQUIRED]
```

### Component Details
- **Frontend SPA**: Built with React 19, TypeScript, and Vite. Compiles down to static HTML/JS/CSS assets deployed to a global CDN edge network.
- **Backend API Server**: Modular TypeScript monolith using Express. Handles authentication, RBAC authorization, server-side pagination, cart management, search queries, and atomic SQL transactions.
- **PostgreSQL Database**: Hosted on Neon Cloud Serverless PostgreSQL with connection pooling (`-pooler`), automated scale-to-zero, SSL encryption, and instant point-in-time restores.
- **External Integrations**: Payment collection, transactional emails, and object storage for user uploads (flagged in this guide where explicit cloud SDK wiring is required).

---

## 2. Accounts You Need

| Service | Website | Why Needed | Account Type | Required |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub** | [github.com](https://github.com) | Source code repository & CI/CD deployment trigger | Free / Team | **Required** |
| **Neon** | [neon.tech](https://neon.tech) | Managed Serverless PostgreSQL database | Free / Pro | **Required** |
| **Vercel** | [vercel.com](https://vercel.com) | Production hosting for React 19 Frontend SPA | Free / Pro | **Required** |
| **Render** | [render.com](https://render.com) | Production hosting for Node.js Express API Server | Free / Starter | **Required** |
| **Razorpay / Stripe** | [razorpay.com](https://razorpay.com) / [stripe.com](https://stripe.com) | Online card, UPI, and netbanking payment processing | Business | **Required** *(for live payments)* |
| **Cloudinary / AWS** | [cloudinary.com](https://cloudinary.com) / [aws.amazon.com](https://aws.amazon.com) | Cloud media storage for product image uploads | Free / Pay-as-you-go | **Recommended** |
| **Resend** | [resend.com](https://resend.com) | Transactional email delivery for order confirmations | Free / Pro | **Recommended** |
| **Namecheap / Cloudflare**| [cloudflare.com](https://cloudflare.com) | Custom domain registration & DNS management | Paid Domain | **Required** *(for production SSL domain)* |

---

## 3. Exact Website Instructions

### 3.1 GitHub Setup
1. Visit [github.com](https://github.com) and sign in.
2. Push your project repository (`https://github.com/Rhytam23/clint-version.git`).
3. Ensure main branch code builds cleanly (`npm run build` and `npm run build:server`).

### 3.2 Neon Database Setup
1. Visit [neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project** and name it `premiumpc`.
3. Select region (e.g. `AWS US East (Ohio) us-east-2`).
4. Copy the direct and pooled `DATABASE_URL` strings under **Connection Details**:
   - **Pooled**: `postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - **Direct**: `postgresql://neondb_owner:PASSWORD@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 3.3 Render (Backend API Hosting)
1. Visit [render.com](https://render.com) and log in using GitHub.
2. Click **New +** → **Web Service**.
3. Select your repository `clint-version`.
4. Configure service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add production environment variables in the **Environment** tab.

### 3.4 Vercel (Frontend SPA Hosting)
1. Visit [vercel.com](https://vercel.com) and log in using GitHub.
2. Click **Add New...** → **Project**.
3. Import `clint-version`.
4. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add `VITE_API_URL` pointing to your Render backend URL (e.g., `https://premiumpc-api.onrender.com`).

---

## 4. Local Development Setup

### Version Requirements
- **Node.js**: `>= 20.0.0` LTS ([nodejs.org](https://nodejs.org))
- **npm**: `>= 10.0.0`
- **Git**: `>= 2.30.0` ([git-scm.com](https://git-scm.com))

### Local Installation Commands (Windows PowerShell)

```powershell
# 1. Clone workspace
git clone https://github.com/Rhytam23/clint-version.git
cd clint-version

# 2. Install root/frontend packages
npm install

# 3. Install server backend packages
cd server
npm install
cd ..

# 4. Initialize database schema & seed
npm run server:migrate
npm run server:seed

# 5. Start dev server
npm run dev:all
```

---

## 5. PostgreSQL Setup

### Hosted Production Provider: Neon PostgreSQL
Neon is the recommended production database provider. It provides instant scale-to-zero, SSL by default, and isolated branching.

- **Account**: Create at [neon.tech](https://neon.tech).
- **Project**: Name `premiumpc`.
- **Database**: Default `neondb` (or `premiumpc`).
- **Connection Security**: Requires `sslmode=require`.
- **IP Restrictions**: Managed via Neon console under **IP Allow**.
- **Backups**: Continuous write-ahead logs (WAL) with 7-day point-in-time recovery.

#### Environment Assignment:
In `server/.env` (or Render Environment Settings):
```env
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_DIRECT=postgresql://neondb_owner:PASSWORD@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 6. Environment Variables

### Complete Reference Table

| Variable | Purpose | Local Value | Production Source | Exposed to Client? |
| :--- | :--- | :--- | :--- | :--- |
| **`NODE_ENV`** | App execution mode | `development` | `production` | Backend Only |
| **`PORT`** | Express server port | `3001` | `10000` (Render default) | Backend Only |
| **`DATABASE_URL`** | Pooled PostgreSQL connection | `postgresql://...-pooler...` | Neon Console | Backend Only |
| **`DATABASE_URL_DIRECT`** | Direct connection for migrations | `postgresql://...` | Neon Console | Backend Only |
| **`JWT_SECRET`** | Secret key to sign JWT auth tokens | `dev_secret_xxx` | Node `crypto.randomBytes` | Backend Only |
| **`JWT_EXPIRES_IN`** | User login token lifetime | `7d` | `7d` | Backend Only |
| **`BCRYPT_ROUNDS`** | Hashing cost factor | `12` | `12` | Backend Only |
| **`CORS_ORIGIN`** | Allowed frontend domain | `http://localhost:5173` | `https://premiumpc.com` | Backend Only |
| **`VITE_API_URL`** | API endpoint URL | `http://localhost:3001` | `https://api.premiumpc.com` | **Frontend Safe** |
| **`VITE_APP_TITLE`** | Storefront page title | `PREMIUM PC` | `PREMIUM PC` | **Frontend Safe** |
| **`VITE_DEFAULT_PAGE_SIZE`**| Catalog pagination limit | `24` | `24` | **Frontend Safe** |
| **`RAZORPAY_KEY_ID`** | Razorpay public key `[IMPLEMENTATION REQUIRED]` | `rzp_test_xxx` | Razorpay Dashboard | **Frontend Safe** |
| **`RAZORPAY_KEY_SECRET`**| Razorpay private key `[IMPLEMENTATION REQUIRED]`| `secret_xxx` | Razorpay Dashboard | Backend Only |
| **`RAZORPAY_WEBHOOK_SECRET`**| Razorpay webhook signature `[IMPLEMENTATION REQUIRED]`| `whsec_xxx` | Razorpay Dashboard | Backend Only |

---

## 7. Database Setup & Management

### Database Commands (Existing Repository Scripts)

- **Run Migrations**:
  ```bash
  npm run server:migrate
  ```
  *Applies schema migrations located in `server/src/db/migrations/001_initial_schema.sql`.*

- **Seed Database**:
  ```bash
  npm run server:seed
  ```
  *Populates categories, brands, enthusiast hardware, specs, inventory, admin (`admin@premiumpc.com`), and customer accounts.*

- **Run API Integration Tests**:
  ```bash
  npm run test:server
  ```
  *Executes 8 automated API integration tests against the database.*

- **Reset Development Database Procedure**:
  Re-run migration and seed in sequence:
  ```bash
  npm run server:migrate && npm run server:seed
  ```

---

## 8. Authentication Setup

Authentication uses **JWT (JSON Web Tokens)** stored in HTTP headers/cookies and **Bcrypt password hashing** (12 rounds).

### Key Authentication Files:
- Service: [`server/src/services/authService.ts`](file:///e:/projesct01/server/src/services/authService.ts)
- Routes: [`server/src/routes/auth.ts`](file:///e:/projesct01/server/src/routes/auth.ts)
- Middleware: [`server/src/middleware/auth.ts`](file:///e:/projesct01/server/src/middleware/auth.ts)

### How First Admin Account Is Created:
When `npm run server:seed` executes, it inserts the default admin user with a pre-hashed bcrypt password:
- **Email**: `admin@premiumpc.com`
- **Default Password**: `AdminPass123!`

### Production First Admin Protection Procedure:
Before deploying to production, update `server/src/db/seed.ts` or change the admin password immediately via `POST /api/auth/login` and user profile update!

---

## 9. Payment Setup `[IMPLEMENTATION REQUIRED]`

For Indian & International e-commerce, **Razorpay** or **Stripe** is recommended.

### Razorpay Setup Instructions:
1. Visit [razorpay.com](https://razorpay.com) and create a business account.
2. Complete KYC business verification.
3. Switch to **Test Mode** in dashboard:
   - Navigate to **Settings** → **API Keys** → **Generate Key**.
   - Copy `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
4. Configure Webhook:
   - Go to **Settings** → **Webhooks** → **Add New Webhook**.
   - Set URL: `https://api.premiumpc.com/api/payments/webhook`
   - Select events: `order.paid`, `payment.failed`.
   - Copy `RAZORPAY_WEBHOOK_SECRET`.
5. In production, toggle dashboard from **Test Mode** to **Live Mode** and regenerate production keys.

---

## 10. Email Setup `[IMPLEMENTATION REQUIRED]`

For transactional emails (Order Confirmation, Order Shipped, Password Reset), use **Resend**.

1. Visit [resend.com](https://resend.com) and create an account.
2. Navigate to **Domains** → **Add Domain** (`premiumpc.com`).
3. Add DNS TXT and MX records in Cloudflare/Namecheap for domain verification.
4. Navigate to **API Keys** → **Create API Key**.
5. Save `RESEND_API_KEY` in server environment settings.

---

## 11. Image and File Storage `[IMPLEMENTATION REQUIRED]`

Product images currently serve static assets or external URLs. For admin image uploads in production, use **Cloudinary** or **AWS S3**.

### Cloudinary Setup:
1. Visit [cloudinary.com](https://cloudinary.com) and register a free account.
2. Copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Configure `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME` in server environment settings.

---

## 12. Search Implementation

Search is implemented using **PostgreSQL Native Full-Text Search**:
- **Search Vector**: `search_vector` TSVECTOR column on the `products` table.
- **Index Type**: GIN index (`idx_products_search`).
- **Service Handler**: [`server/src/services/searchService.ts`](file:///e:/projesct01/server/src/services/searchService.ts)
- **Endpoint**: `GET /api/search?search=rtx`

*PostgreSQL full-text search is production-ready for catalogs up to 100,000+ items without requiring external Elasticsearch/Meilisearch infrastructure.*

---

## 13. Backend Deployment (Render.com)

1. Create a Web Service on [render.com](https://render.com).
2. Connect GitHub repository `clint-version`.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = *(Neon Pooled Connection String)*
   - `JWT_SECRET` = *(Cryptographic 128-char secret)*
   - `CORS_ORIGIN` = `https://premiumpc.com`
5. Deploy and verify health endpoint at `https://api.premiumpc.com/health`.

---

## 14. Frontend Deployment (Vercel)

1. Create a Project on [vercel.com](https://vercel.com).
2. Import GitHub repository `clint-version`.
3. Settings:
   - **Framework**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL` = `https://api.premiumpc.com`
   - `VITE_APP_TITLE` = `PREMIUM PC - Hardware & Custom Rigs`
5. Deploy.

---

## 15. Domain Setup

Configure custom domain DNS records via Cloudflare or Namecheap:

```text
www.premiumpc.com ──── (CNAME) ───► cname.vercel-dns.com   (Frontend)
api.premiumpc.com ──── (CNAME) ───► premiumpc.onrender.com (Backend API)
```

---

## 16. CORS Configuration

In `server/src/index.ts`, CORS is locked to `config.cors.origin`.

- **Development**: `http://localhost:5173`
- **Production**: `https://premiumpc.com` or `https://www.premiumpc.com`

> [!WARNING]
> Never set `CORS_ORIGIN=*` in production for an authenticated API using JWTs or cookies.

---

## 17. Security Configuration

- **HTTPS Only**: Enforced by Vercel & Render SSL certificates.
- **Helmet Security Headers**: Active in [`server/src/index.ts`](file:///e:/projesct01/server/src/index.ts).
- **Rate Limiting**: Configured with `express-rate-limit` (100 requests per 15 minutes per IP).
- **Parameterized SQL**: All database queries in `server/src/services/` use parameterized `$1, $2` inputs.
- **Password Safety**: `bcryptjs` 12 salt rounds for all user authentication.

---

## 18. GitHub Setup & Secret Protection

Verify `.gitignore` contains:
```text
node_modules/
dist/
server/dist/
.env
server/.env
.neon
server/.neon
```

Never commit `.env` or credentials to git history.

---

## 19. Production Database Preparation

Prior to launch:
1. Run migrations against production Neon database:
   ```bash
   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run server:migrate
   ```
2. Run catalog seed:
   ```bash
   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run server:seed
   ```
3. Change default admin password via `/api/auth/login` and user profile endpoint.

---

## 20. Production Monitoring

- **API Health Endpoint**: Periodically ping `GET /health` using UptimeRobot or Better Stack (Free).
- **Application Logs**: Monitored via Render Dashboard → Logs and Vercel Deployment Logs.

---

## 21. Backup & Recovery

- **Database Point-in-Time Restore**: Neon provides automated rolling backups. Restore any point in time via Neon Console → **Branches** → **Restore to point in time**.
- **Manual Database Export**:
  ```bash
  pg_dump "postgresql://neondb_owner:PASSWORD@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" > premiumpc_backup.sql
  ```

---

## 22. Pre-Launch Testing Workflow

Perform end-to-end testing on staging/production URLs:

- [x] Account Registration & Login
- [x] Admin Role Verification
- [x] Product Catalog Browsing & Category Filtering
- [x] Full-Text Search (?search=rtx)
- [x] URL Parameter Sync & Pagination
- [x] Cart Addition & Quantity Updates
- [x] Server-Calculated Order Totals
- [x] Order Creation & History Retrieval
- [x] Mobile & Desktop Responsive Layouts

---

## 23. Production Launch Sequence

```text
 1. Register Domain (premiumpc.com)
 2. Create Neon PostgreSQL Database
 3. Create Cloud Storage Bucket (Cloudinary / S3) [IMPLEMENTATION REQUIRED]
 4. Configure Production API Keys (JWT Secret, Database URL)
 5. Deploy Backend to Render (api.premiumpc.com)
 6. Run Database Migrations on Production DB
 7. Seed Production Catalog Data
 8. Deploy Frontend to Vercel (www.premiumpc.com)
 9. Configure Production CORS Origin
10. Run End-to-End Test Suite
11. Point Custom DNS Records
12. Go Live
```

---

## 24. Post-Launch Verification Checks

After pointing domain records:
1. Open `https://www.premiumpc.com`.
2. Inspect browser Network tab to verify all requests route to `https://api.premiumpc.com/api/...` with 200 OK statuses.
3. Test placing a test order.
4. Verify record creation in Admin Console.

---

## 25. Troubleshooting

### Problem 1: `ECONNREFUSED` / Database Connection Error
- **Cause**: Incorrect `DATABASE_URL` or missing `sslmode=require`.
- **Fix**: Verify Neon pooled URL format in server environment variables.

### Problem 2: CORS Header Missing / Blocked by CORS
- **Cause**: `CORS_ORIGIN` does not match exact production domain (including `https://`).
- **Fix**: Update `CORS_ORIGIN` in Render environment settings.

### Problem 3: 401 Unauthorized on Admin Routes
- **Cause**: User role in database is not `admin` or `staff`.
- **Fix**: Verify user role column in `users` table (`role = 'admin'`).

---

## 26. Cost Awareness

| Tier | Estimated Monthly Cost | Services Included |
| :--- | :--- | :--- |
| **Development & Testing** | **\$0.00 / mo** | Neon Free Tier + Vercel Hobby + Render Free + Local Dev |
| **Production Starter** | **~\$7.00 - \$15.00 / mo** | Render Starter Web Service (\$7/mo) + Neon Free/Launch + Vercel Free |
| **Production Growth** | **~\$25.00 - \$50.00 / mo** | Render Standard + Neon Launch + Custom Domain + Resend Pro |

---

## 27. PRODUCTION_READY_CHECKLIST

- [x] Database configured (Neon PostgreSQL)
- [x] Schema migrations created and tested
- [x] Backend API server implemented (Express + TS)
- [x] Frontend application implemented (React 19 + Vite)
- [x] Centralized API client configured
- [x] Password hashing (Bcrypt) & JWT auth active
- [x] Server-side price & order integrity enforced
- [x] Pagination & URL parameter sync active
- [x] API documentation created (`docs/API.md`)
- [x] Local setup guide created (`docs/SETUP.md`)
- [x] Automated test suite passing (`npm run test:server` 8/8)
- [ ] Production domain registered & connected
- [ ] HTTPS & SSL certificates active
- [ ] Production environment secrets configured
- [ ] Payment gateway keys wired `[IMPLEMENTATION REQUIRED]`
- [ ] Transactional email API wired `[IMPLEMENTATION REQUIRED]`
- [ ] Cloud media storage bucket configured `[IMPLEMENTATION REQUIRED]`
- [x] Final production launch guide documented
