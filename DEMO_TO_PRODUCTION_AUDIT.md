# Superseded

This document is **obsolete and its claims were inaccurate**. It described `server/` in isolation and labelled
features "PRODUCTION READY" that the shipped React application never used — at the time it was written the
storefront ran entirely on hardcoded data in `src/data/index.ts` and its checkout marked orders paid without
taking payment.

Specific claims in this file that were contradicted by the code:

- "Plaintext OTP codes are never logged to production console logs" — they were, unconditionally.
- "Replay and duplicate webhook protected" — no idempotency store existed.
- "Stock Deductions … Implemented" — `deductConfirmed()` was never called from anywhere.
- "Orders are updated to `paid` … exclusively upon cryptographic Stripe Webhook verification" — a dev-mode
  branch marked orders paid with no payment at all.

**See [`PRODUCTION_ECOMMERCE_AUDIT.md`](./PRODUCTION_ECOMMERCE_AUDIT.md)** for the current, verified status.
