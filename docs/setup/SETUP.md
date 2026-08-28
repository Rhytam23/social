# PREMIUM PC — Complete Local Setup & Development Guide

This guide provides step-by-step instructions for installing, configuring, initializing, and running the **PREMIUM PC** e-commerce platform locally from scratch.

---

## 1. System Requirements & Prerequisites

Before starting, ensure the following software is installed on your development machine:

| Software | Required Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (LTS) | `node --version` |
| **npm** | `>= 10.0.0` | `npm --version` |
| **PostgreSQL** | `>= 15.0` | `psql --version` |
| **Git** | `>= 2.30.0` | `git --version` |

---

## 2. Repository Installation

Clone the repository and install dependencies for both the frontend application and the backend API server.

### Step 2.1: Clone Repository
```bash
git clone https://github.com/Rhytam23/clint-version.git
cd clint-version
```

### Step 2.2: Install Frontend Dependencies
```bash
npm install
```

### Step 2.3: Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

---

## 3. PostgreSQL Database Setup

The backend uses a PostgreSQL relational database. Follow the instructions for your operating system or use Docker.

### Option A: Native Installation (Windows / macOS / Linux)

#### Windows:
1. Download and run the PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/).
2. Open **pgAdmin** or **Command Prompt** / **PowerShell**.
3. Create the database `premiumpc`:
```powershell
# Using psql command line
psql -U postgres -c "CREATE DATABASE premiumpc;"
```

#### macOS (Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
createdb premiumpc -U postgres
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE premiumpc;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
```

### Option B: Docker Setup (Optional Quick Start)

If you have Docker Desktop installed, you can launch a PostgreSQL container with one command using the included `docker-compose.yml`:

```bash
docker-compose up -d postgres
```
This automatically starts a PostgreSQL 16 container listening on `localhost:5432` with database `premiumpc`, user `postgres`, and password `password`.

---

## 4. Environment Variables Configuration

The platform requires configuration files for both the frontend SPA and the backend API server.

### Step 4.1: Backend Environment Setup
Copy `server/.env.example` to `server/.env`:

```bash
# On Windows PowerShell:
Copy-Item server/.env.example server/.env

# On Linux/macOS:
cp server/.env.example server/.env
```

#### `server/.env` Reference:
```env
# ── Server ──────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3001

# ── PostgreSQL ───────────────────────────────────────────────────────────────
# Connection string format: postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>
DATABASE_URL=postgresql://postgres:password@localhost:5432/premiumpc

# ── JWT Secret ───────────────────────────────────────────────────────────────
JWT_SECRET=dev_secret_change_before_production_abc123xyz789
JWT_EXPIRES_IN=7d

# ── Security & Limits ────────────────────────────────────────────────────────
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ── Frontend CORS Origin ─────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173

# ── Degradation Fallback (for offline DB testing) ─────────────────────────────
ALLOW_DB_FAIL=true
```

### Step 4.2: Frontend Environment Setup
Copy `.env.example` to `.env`:

```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS:
cp .env.example .env
```

#### `.env` Reference:
```env
VITE_APP_TITLE="PREMIUM PC - Hardware & Custom Rigs"
VITE_API_URL=http://localhost:3001
VITE_DEFAULT_PAGE_SIZE=24
```

---

## 5. Secret Generation Guide

To generate cryptographically secure secrets for production or local development, use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated 128-character hexadecimal string and assign it to `JWT_SECRET` in `server/.env`.

---

## 6. Database Initialization (Migrations & Seeding)

Execute the migration and seeding scripts to build the relational schema and import the hardware catalog.

### Step 6.1: Run Schema Migrations
```bash
npm run server:migrate
```
*Creates `users`, `categories`, `brands`, `products`, `inventory`, `carts`, `orders`, `wishlist_items`, and `reviews` tables along with triggers and indexes.*

### Step 6.2: Seed Database
```bash
npm run server:seed
```
*Populates default categories, brand partners, enthusiast hardware products, specifications, inventory stock levels, and initial admin/customer accounts.*

#### Initial Seed Credentials:
- **Admin Account**: `admin@premiumpc.com` / `AdminPass123!`
- **Customer Account**: `customer@premiumpc.com` / `Customer123!`

---

## 7. Running the Application Locally

### Step 7.1: Start the Backend API Server
From the root directory:
```bash
npm run dev:server
```
*Expected Server Terminal Output:*
```text
[Server] Database connection established.
[Server] Running on http://localhost:3001
[Server] Environment: development
[Server] CORS origin: http://localhost:5173
```

### Step 7.2: Start the Frontend Application
Open a second terminal window in the project root and run:
```bash
npm run dev
```
*Expected Vite Terminal Output:*
```text
  VITE v8.2.1  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 8. API Health Verification

Verify backend availability by sending HTTP requests:

```bash
# Health Check Endpoint
curl http://localhost:3001/health

# Public Products Catalog (Paginated)
curl http://localhost:3001/api/products?page=1&limit=5

# Categories List
curl http://localhost:3001/api/categories

# Search API
curl http://localhost:3001/api/search?q=rtx
```

---

## 9. First-Run Testing Checklist

Verify all core flows before proceeding to development:

- [ ] PostgreSQL service is active on `localhost:5432`.
- [ ] Database `premiumpc` exists.
- [ ] `server/.env` and `.env` files created.
- [ ] `npm run server:migrate` completed cleanly.
- [ ] `npm run server:seed` completed cleanly.
- [ ] Backend starts on `http://localhost:3001`.
- [ ] Frontend starts on `http://localhost:5173`.
- [ ] `http://localhost:3001/health` returns `200 OK` or `503 Degraded`.
- [ ] Storefront homepage loads hardware catalog.
- [ ] Product filtering by category and brand works.
- [ ] Server-side pagination updates URL parameters (`?page=2`).
- [ ] Cart item additions update backend drawer overlay.
- [ ] Checkout creates persistent order records.
- [ ] Admin login unlocks console (`admin@premiumpc.com` / `AdminPass123!`).

---

## 10. Developer Commands Quick Reference

| Action | Root Command | Backend Direct Command |
| :--- | :--- | :--- |
| **Start Frontend** | `npm run dev` | N/A |
| **Start Backend Dev** | `npm run dev:server` | `cd server && npm run dev` |
| **Build Frontend** | `npm run build` | N/A |
| **Build Backend** | `npm run build:server` | `cd server && npm run build` |
| **Lint Codebase** | `npm run lint` | `cd server && npm run lint` |
| **Run API Integration Tests**| `npm run test:server` | `cd server && npm run test` |
| **Run DB Migrations** | `npm run server:migrate` | `cd server && npm run migrate` |
| **Run DB Seed** | `npm run server:seed` | `cd server && npm run seed` |

---

## 11. Troubleshooting Common Problems

### Problem 1: `ECONNREFUSED` — PostgreSQL Connection Failed
- **Cause**: PostgreSQL server is not running or listening on port `5432`.
- **Check**: Run `pg_isready -h localhost -p 5432` or check Services manager.
- **Fix**: Start PostgreSQL service (`net start postgresql-x64-16` or `docker-compose up -d postgres`).

### Problem 2: `Port 3001 Already in Use`
- **Cause**: A background process or previous Node process is occupying port `3001`.
- **Check**: Run `netstat -ano | findstr :3001` (Windows) or `lsof -i :3001` (Linux/macOS).
- **Fix**: Kill process or update `PORT=3002` in `server/.env` and `VITE_API_URL` in `.env`.

### Problem 3: CORS Error in Browser Console
- **Cause**: `CORS_ORIGIN` in `server/.env` does not match Vite frontend origin.
- **Check**: Inspect browser console network headers.
- **Fix**: Ensure `CORS_ORIGIN=http://localhost:5173` matches Vite dev server address.

---

## 12. Safe Database Reset Procedure

To drop and re-initialize the development database:

> [!WARNING]
> This procedure will destroy all local database records and re-seed clean catalog data.

```bash
# 1. Drop existing tables and run migrations
npm run server:migrate

# 2. Re-seed fresh catalog data
npm run server:seed
```

---

## 13. Production Deployment Guidelines

When deploying to production environments (Vercel, Railway, Render, AWS):

1. **Environment Variables**: Use strong production secrets for `JWT_SECRET` and secure database credentials in `DATABASE_URL`.
2. **SSL / TLS**: Set `DB_SSL=true` for managed PostgreSQL instances (Supabase, Neon, AWS RDS).
3. **Database Migration**: Execute `npm run server:migrate` in release pipeline prior to starting production server tasks.
4. **CORS Hardening**: Set `CORS_ORIGIN` strictly to the custom production domain e.g. `https://premiumpc.com`.
