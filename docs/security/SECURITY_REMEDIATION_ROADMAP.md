# Security Remediation Roadmap

This document outlines the prioritized security roadmap for the application prior to client handoff and public launch.

---

## 1. MUST FIX BEFORE LAUNCH

- [x] **Automated Database Migrations Check**: Server automatically runs DDL migrations (`DATABASE_URL_DIRECT`) on boot so database tables (`users`, `otp_codes`, `orders`, etc.) are never missing.
- [x] **HTTP-Only Cookie Enforcement**: Session tokens set via HTTP-only, `SameSite=Lax`, and `Secure` cookies (`setAuthCookie`).
- [x] **Server-Side RBAC Protection**: Admin endpoints (`/api/admin/*`) enforce `requireAdmin` and `requireStaff` middleware checks.
- [x] **Strict CORS & HTTP Security Headers**: Backend limits origins strictly to `https://clint-version.vercel.app` and sends Helmet security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- [ ] **Manual Credential Rotation**: Execute manual secret rotation in cloud provider dashboards for `JWT_SECRET`, `DATABASE_URL`, and `DATABASE_URL_DIRECT`.

---

## 2. SHOULD FIX BEFORE CLIENT HANDOFF

- [ ] **Stripe Live Payment Verification**: Verify server-side webhook signature checking (`stripe.webhooks.constructEvent`) and server-side order total re-calculation against database item prices before enabling real payments.
- [ ] **Account Lockout Policy**: Implement incremental IP + email lockouts after 5 consecutive failed login attempts on `/api/auth/login`.

---

## 3. POST-LAUNCH

- [ ] **Dependency Minor Upgrades**: Upgrade `uuid` to 11.1.1+ in a minor release window following full regression testing.
- [ ] **Strict Content-Security-Policy**: Configure explicit CSP directives for Google OAuth scripts and CDN asset domains.

---

## 4. OPTIONAL ENHANCEMENTS

- [ ] **Automated Integration Test Mocks**: Add dedicated mock database runners for local offline unit tests.
