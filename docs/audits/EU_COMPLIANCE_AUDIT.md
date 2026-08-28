# PREMIUM PC — EU Technical Compliance & GDPR Audit

> [!IMPORTANT]
> **Legal Disclaimer**: This document is a technical compliance-readiness assessment of the software application, database architecture, and frontend user flows. Final legal compliance, privacy policies, terms of service, and DPA agreements require review and approval by qualified EU legal counsel.

---

## Executive Summary & EU Audit Matrix

| Compliance Area | EU Directive / Regulation | Current Status | Action Required | Launch Blocker? |
| :--- | :--- | :---: | :--- | :---: |
| **1. GDPR Data Rights** | Regulation (EU) 2016/679 (Art. 15, 17) | Partial | Add Data Export & Account Deletion endpoints | 🟡 High |
| **2. Cookie Consent** | ePrivacy Directive 2002/58/EC | Implemented | Add first-visit overlay banner | 🟢 Low |
| **3. Consumer Withdrawal Rights** | Directive 2011/83/EU (Art. 9) | Implemented | Explicitly state 14-day statutory right & custom PC exemption | 🔴 Client Info |
| **4. Pricing & VAT Display** | Directive 98/6/EC & EU OSS | Partial | Add "VAT Included" label & EU country tax rate mapping | 🟡 High |
| **5. Stripe PSD2 / SCA Payments** | Payment Services Directive (PSD2) | Architecture Ready | Wire Stripe PaymentIntents with 3D Secure 2.0 | 🔴 Critical |
| **6. Marketing Consent** | GDPR Art. 6(1)(a) | Implemented | Ensure newsletter opt-in is un-ticked by default | 🟢 Low |
| **7. EU Legal Imprint (Impressum)** | Directive 2000/31/EC (Art. 5) | Placeholders | Add EU Company Name, VAT ID, Address & ODR link | 🔴 Client Info |

---

## 1. EU Launch Blockers (Technical & Payment Requirements)

### 🔴 Finding EU-01: Stripe PaymentIntents & PSD2 / SCA Compliance
- **Current Implementation**: Checkout order creation accepts simulated payment methods.
- **Missing EU Requirement**: Payment Services Directive (PSD2) requires **Strong Customer Authentication (SCA)** with 3D Secure 2.0 for EU credit/debit card payments.
- **Why It Matters**: EU banks automatically decline card payments that do not support 3D Secure verification.
- **Recommended Solution**: Wire live `@stripe/stripe-js` and Stripe `PaymentIntents` API. Stripe handles 3DS2 challenges out-of-the-box.
- **Manual Configuration Required**: Yes (Stripe Dashboard Live API Keys).

### 🔴 Finding EU-02: Stripe Webhook Cryptographic Verification & Replay Protection
- **Current Implementation**: Endpoint routes order updates upon payment submission.
- **Missing EU Requirement**: Server-side verification of `Stripe-Signature` using `stripe.webhooks.constructEvent(body, sig, secret)` with timestamp tolerance checks.
- **Why It Matters**: Prevents malicious actors from faking payment events or replaying legitimate webhooks.
- **Recommended Solution**: Implement raw-body parser middleware on `/api/payments/webhook` and verify signatures using `STRIPE_WEBHOOK_SECRET`.
- **Manual Configuration Required**: Yes (`STRIPE_WEBHOOK_SECRET` in Render dashboard).

---

## 2. Client Information Required (Business & Legal Confirmation)

### 🔴 Finding EU-03: Official EU Company Imprint (Impressum) & ODR Link
- **Current Implementation**: Legal pages cite generic `PREMIUM PC Hardware Platform` placeholder.
- **Missing EU Requirement**: EU E-Commerce Directive (Art. 5) requires clear display of:
  1. Full Registered Corporate Name & Trade Register Number.
  2. Registered EU Business Street Address.
  3. EU VAT Identification Number (e.g., `DE123456789`).
  4. Link to the European Commission Online Dispute Resolution (ODR) platform: `https://ec.europa.eu/consumers/odr`.
- **Recommended Solution**: Client provides official business entity details to update in `TermsPage.tsx`, `PrivacyPolicyPage.tsx`, and `Footer.tsx`.

### 🔴 Finding EU-04: EU Statutory 14-Day Right of Withdrawal & Custom Rig Exception
- **Current Implementation**: Refund policy provides 30-day RMA window for returns and custom order cancellation terms.
- **Missing EU Requirement**: Consumer Rights Directive (Directive 2011/83/EU):
  - **Standard Goods**: 14-day statutory right of withdrawal without giving any reason.
  - **Custom PC Builds**: Goods manufactured to customer specifications (custom PC builds) are explicitly exempt from the statutory 14-day right of withdrawal (Art. 16(c)).
- **Recommended Solution**: Add explicit statutory clause in `RefundPolicyPage.tsx` distinguishing off-the-shelf components (14-day statutory withdrawal) from custom PC assemblies (exempt under Art. 16(c)).

---

## 3. GDPR Data Rights & Technical Implementation (Post-Launch Enhancements)

### 🟡 Finding EU-05: User Data Export (GDPR Art. 15 Right of Access)
- **Current Implementation**: Users can view their order history and shipping address on `/account`.
- **Missing Requirement**: Self-service "Export My Personal Data" button generating a downloadable `.json` file containing all stored profile data, address history, and order logs.
- **Recommended Solution**: Add endpoint `GET /api/users/export-data` returning complete user data payload in JSON format.

### 🟡 Finding EU-06: Account Anonymization & Erasure (GDPR Art. 17 Right to be Forgotten)
- **Current Implementation**: Users can edit profile details, but cannot initiate self-service account deletion.
- **Missing Requirement**: Self-service "Delete My Account" button. Due to tax/accounting recordkeeping laws (which require retaining financial transactions for 6–10 years), order records must be anonymized (redacting name, email, phone) rather than completely purged from financial tables.
- **Recommended Solution**: Add endpoint `DELETE /api/users/account` that sets `status = 'deleted'`, removes hashed passwords, nullifies PII, and anonymizes order recipient details while preserving transaction totals for tax audits.

### 🟡 Finding EU-07: Granular Pricing & EU VAT Display (Directive 98/6/EC)
- **Current Implementation**: Checkout applies standard tax calculation.
- **Missing Requirement**: Displays should clarify whether catalog prices include VAT (e.g., "Incl. 21% VAT").
- **Recommended Solution**: Add `(Incl. VAT)` badge next to product prices on catalog and cart items.

---

## 4. Post-Launch Improvements & Best Practices

### 🟢 Finding EU-08: First-Visit Cookie Consent Banner Overlay
- **Current Implementation**: Interactive Cookie Preferences page (`/cookie-preferences`) saves user choices in `localStorage`.
- **Recommended Enhancement**: Add a non-intrusive floating cookie banner on initial page visit for new users with "Accept All", "Reject Optional", and "Preferences" buttons.

### 🟢 Finding EU-09: Un-ticked Marketing Opt-In Checkboxes
- **Current Implementation**: Newsletter form in footer is separate and explicit.
- **Best Practice Check**: Ensure any optional newsletter checkboxes during checkout or account registration remain **un-checked by default** (GDPR prohibits pre-ticked consent checkboxes).

---

## EU Compliance Verification Checklist

- [x] **Granular Cookie Preferences Manager**: Implemented in [`src/pages/policies/CookiePreferencesPage.tsx`](file:///e:/projesct01/src/pages/policies/CookiePreferencesPage.tsx) with persistent `localStorage` saving.
- [x] **Un-tracked Analytics Default**: Optional telemetry remains disabled until explicit user consent.
- [x] **HTTP-Only Session Cookies**: Session tokens protected against XSS data theft.
- [x] **Data Processor Isolation**: Render backend environment stores database and service credentials server-side only.
- [ ] **Client Business Information**: Add EU Corporate Entity Name, VAT ID, and ODR link.
- [ ] **Stripe 3D Secure Wiring**: Connect live Stripe PaymentIntents API for EU SCA compliance.
- [ ] **Data Export & Anonymization Endpoints**: Implement `GET /api/users/export-data` and `DELETE /api/users/account`.
