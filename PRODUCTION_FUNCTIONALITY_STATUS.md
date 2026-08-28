# Production Functionality Status

This document categorizes all platform features, background services, payment routes, and environment configurations into their exact operational state: `WORKING`, `REQUIRES CONFIGURATION`, `REQUIRES CLIENT ACTION`, or `NOT IMPLEMENTED`.

---

## 1. Status Classification Matrix

### 🟢 WORKING (Fully Implemented & Verified in Codebase)

- **PostgreSQL Database Engine**: Neon PostgreSQL connected via `DATABASE_URL` (pooled) and `DATABASE_URL_DIRECT` (direct for DDL migrations).
- **Automated DDL Schema Migrations**: Boots on Express startup with PostgreSQL advisory locking (`pg_advisory_lock(84729103)`), creating `users`, `otp_codes`, `orders`, `products`, `inventory`, `carts`, `categories`, `brands`, and `schema_migrations`.
- **Stripe Payment Gateway Integration**: Real Stripe PaymentIntents backend API (`/api/payments/create-intent`), server-side verification (`/api/payments/verify`), and cryptographic webhook listener (`/api/payments/webhook`) with raw-body signature validation (`stripe.webhooks.constructEvent`).
- **Server-Side Price & Order Security**: Subtotal, tax, shipping, and order total calculated strictly from database rows. Client price inputs are ignored.
- **Atomic Inventory Control**: Stock reservation executed inside PostgreSQL transactions (`withTransaction`), preventing negative stock and race conditions.
- **HTTP-Only Cookie Sessions**: Auth tokens managed exclusively via HTTP-only, `SameSite=Lax`, `Secure` cookies (`token`). No tokens stored in `localStorage`.
- **OAuth Integration**: Google & GitHub OAuth handlers with 32-byte CSRF `oauth_state` cookie verification.
- **SHA-256 OTP Code Hashing**: 6-digit email OTPs stored exclusively as SHA-256 hashes (`code_hash`) with 5-attempt brute-force protection.
- **Admin Panel RBAC Authorization**: Server-side `requireAdmin` and `requireStaff` guards on all `/api/admin/*` endpoints. Category deletion locked by active product dependency checks.
- **Cookie Consent Manager**: `CookiePreferencesPage.tsx` controlling optional tracking execution while enforcing essential cookies.

---

### 🟡 REQUIRES CONFIGURATION (Dashboard Environment Variables Needed)

To activate live payment collection and transactional email delivery, enter the following environment keys in your **Render Web Service Dashboard**:

1. **`STRIPE_SECRET_KEY`**: Production or test Stripe secret key (`sk_live_...` or `sk_test_...`).
2. **`STRIPE_WEBHOOK_SECRET`**: Stripe webhook signing secret (`whsec_...`) from Stripe Dashboard ➔ Webhooks.
3. **`RESEND_API_KEY`**: Production Resend API key (`re_...`) for sending real transactional emails.
4. **`EMAIL_FROM`**: Verified sender address (e.g. `PREMIUM PC <orders@yourdomain.com>`).
5. **`VITE_STRIPE_PUBLISHABLE_KEY`**: Stripe publishable key (`pk_live_...` or `pk_test_...`) in Vercel Environment Variables.

---

### 🔴 REQUIRES CLIENT ACTION (Business Decisions & External Setup)

1. **Stripe Merchant Account Verification**: Complete Stripe account activation and bank account linking for payouts.
2. **Domain DNS Verification**: Add SPF, DKIM, and DMARC DNS records in Cloudflare/Namecheap for Resend domain authorization.
3. **Legal Imprint Details**: Insert legal business registration numbers, official corporate address, and VAT ID in footer and privacy policy pages.

---

## 2. Production Environment Summary

| Component | Target URL | Operational Provider | Status |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | `https://clint-version.vercel.app` | Vercel Edge Network | 🟢 Working |
| **Backend API** | `https://clint-version.onrender.com` | Render Web Service | 🟢 Working |
| **Database** | Neon Cloud PostgreSQL | Neon Cloud (Ohio AWS) | 🟢 Working |
| **Payment Gateway** | Stripe API (`/api/payments/*`) | Stripe Payments | 🟡 Requires API Keys |
| **Email Delivery** | Resend API (`emailService.ts`) | Resend Email | 🟡 Requires API Key |
