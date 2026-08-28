# PREMIUM PC — Deployment Architecture & Operations Guide

This guide details the production deployment architecture, hosting providers, continuous deployment triggers, environment configuration, and verification steps for the **PREMIUM PC** platform.

---

## 1. Production Architecture Overview

The platform uses a decoupled client-server architecture hosted across cloud edge networks and managed web services:

```text
[ Browser / Client Device ]
             │
             ├── (HTTPS Static Assets & Routes) ──► [ Vercel Global Edge Network ]
             │                                       • React 19 SPA Distribution
             │                                       • vercel.json SPA Rewrites
             │
             └── (HTTPS REST API & Auth Cookies) ──► [ Render Web Service ]
                                                       • Node.js Express API Server
                                                       • CORS & Helmet Security
                                                       • Auto DDL Migrations
                                                       │
                                                       ▼
                                             [ Neon PostgreSQL Cluster ]
                                               • Serverless Database
                                               • Connection Pooling (-pooler)
```

---

## 2. Cloud Infrastructure Providers

| Layer | Provider | Web Console | Live Endpoint | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA** | **Vercel** | [vercel.com](https://vercel.com) | `https://clint-version.vercel.app` | Static React 19 bundle distribution |
| **Backend API** | **Render** | [render.com](https://render.com) | `https://clint-version.onrender.com` | Express API runtime & background services |
| **Database** | **Neon Cloud** | [neon.tech](https://neon.tech) | `ep-gentle-shape-aylpm2jm...` | Managed Serverless PostgreSQL 16 |

---

## 3. Environment Configuration & Secrets

### 3.1 Frontend (Vercel Environment Settings)
- `VITE_APP_TITLE`: `"PREMIUM PC - Hardware & Custom Rigs"`
- `VITE_API_URL`: `https://clint-version.onrender.com`
- `VITE_API_TIMEOUT`: `10000`

### 3.2 Backend (Render Environment Settings)
- `NODE_ENV`: `"production"`
- `PORT`: `10000` (Render default or automatic assignment)
- `DATABASE_URL`: Pooled connection string (`-pooler.aws.neon.tech`)
- `DATABASE_URL_DIRECT`: Direct connection string (without pooler, used for DDL migrations)
- `JWT_SECRET`: 64-character random secret key
- `CORS_ORIGIN`: `https://clint-version.vercel.app`

---

## 4. Build & Deployment Commands

### 4.1 Frontend Build (Vercel Project Settings)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4.2 Backend Build (Render Service Settings)
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`

---

## 5. Automated Database Migrations

On production startup, the backend Express server automatically runs pending DDL migrations in `server/src/db/migrations/` using `DATABASE_URL_DIRECT`. This guarantees that required tables (`users`, `otp_codes`, `orders`, `products`, `inventory`, `categories`, `brands`, etc.) are initialized automatically.

---

## 6. Post-Deployment Health Check

Verify production deployment availability:

```bash
# Health Check Endpoint
curl https://clint-version.onrender.com/health

# Public Products Catalog API
curl https://clint-version.onrender.com/api/products?page=1&limit=5
```
