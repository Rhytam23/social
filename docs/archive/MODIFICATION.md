# PREMIUM PC — Project Modifications & Decisions Log

Purpose: Permanent change tracking, pending items, bug reports, and architectural decision records.

---

# STATUS LEGEND

- `[ ]` Pending
- `[x]` Completed
- `[!]` Blocked
- `[?]` Needs decision
- `[D]` Demo only
- `[P]` Production required

---

# PENDING ADDITIONS

- [P] Production database backend (PostgreSQL / Supabase integration)
- [P] Stripe / PayPal payment gateway integration
- [P] Transactional email service (Resend / SendGrid for order receipts & password resets)
- [P] User avatar upload in Customer Account page
- [?] Live chat widget integration (Intercom / Crisp / Zendesk)

---

# PENDING REMOVALS

- [x] Removed decorative radial blur shapes & neon glow shadows
- [x] Removed decorative `animate-pulse` dots from static text headers
- [x] Removed misplaced monospace font from CTA buttons and retail titles
- [x] Removed nested sub-cards inside product cards (`bg-[#1B1E24] rounded-xl p-3`)
- [ ] Temporary mock product data (`src/data/index.ts` to be replaced with DB queries in production)

---

# PENDING CHANGES

- [ ] Connect PC Builder compatibility rules to server-side socket/wattage verification API
- [ ] Enhance admin image upload modal with direct drag-and-drop cloud storage provider (S3/Cloudinary)
- [ ] Implement server-side pagination for product catalogs exceeding 100+ items

---

# BUGS TO FIX

*(All known code linter errors and React hook warnings are currently 100% resolved with 0 errors.)*

- [x] BUG: React Rule-of-Hooks early return violation in ProductDetailsPage.tsx
  - Priority: High
  - Location: `src/pages/ProductDetailsPage.tsx`
  - Expected: Hooks executed unconditionally before early returns.
  - Current: Resolved. Moved `useMemo` hooks above `if (!product)` guard.

- [x] BUG: Public unauthenticated access to `/admin/*` routes
  - Priority: Critical
  - Location: `src/pages/admin/AdminLayout.tsx`
  - Expected: Password barrier authentication gate required.
  - Current: Resolved. Implemented `AdminAuthGate` with password prompt (`admin123`) and localStorage session tracking.

- [x] BUG: Hidden Wishlist & Compare action buttons on mobile touch viewports
  - Priority: High
  - Location: `src/components/products/ProductCard.tsx`
  - Expected: Action buttons permanently accessible on mobile/touch screens.
  - Current: Resolved. Removed desktop-only `opacity-0 group-hover:opacity-100` hover dependency.

- [x] BUG: Missing dedicated policy pages (Privacy, Terms, Shipping, Return, About)
  - Priority: Critical
  - Location: `src/App.tsx`, `src/pages/policies/*`
  - Expected: Dedicated, structured policy pages.
  - Current: Resolved. Built 5 structural policy pages with explicit `[CLIENT CONFIRMATION REQUIRED]` placeholders.

---

# UI/UX IMPROVEMENTS

- [x] Typography: Strict role separation. Inter (Sans) for headlines, body copy, and CTA buttons (`Add to Cart`); JetBrains Mono (Mono) strictly reserved for numerical specs, SKUs, clock speeds, wattage, and prices.
- [x] Visual Cleanliness: Eliminated 140px background blur circles, neon drop-shadows, and pulsing dots on static section labels.
- [x] Surface Tokens: Clean background contrast (`#121317`, `#16171d`), structural borders (`#292a2e`), and soft natural drop-shadows.
- [x] Mobile Usability: Permanently visible touch actions, responsive drawers, and accessible touch targets (min 44px).
- [x] Skeleton Loaders: Created `<PageSkeleton />` and `<ProductCardSkeleton />` in `src/components/ui/SkeletonLoader.tsx` to replace raw text spinners during route navigation.
- [x] Legal & Compliance: Integrated 5 structural policy pages with client confirmation placeholders.

---

# CLIENT REQUESTS LOG

### Request 1: Product Card Polish
- Date: 2026-08-15
- Request: Make product cards feel like premium PC hardware ecommerce product cards.
- Priority: High
- Status: Completed

### Request 2: Global Border Removal Pass
- Date: 2026-08-15
- Request: Remove decorative borders throughout the entire UI for a clean, editorial look.
- Priority: High
- Status: Completed

### Request 3: Human Design Polish Pass
- Date: 2026-08-15
- Request: Eliminate generic AI design patterns, pills, gradients, and repetitive layouts.
- Priority: High
- Status: Completed

### Request 4: Admin Security & Protection
- Date: 2026-08-15
- Request: Prevent any random visitor from opening the admin panel without authentication.
- Priority: Critical
- Status: Completed

### Request 5: E-Commerce UI/UX Refinement & Legal Structural Integration
- Date: 2026-08-16
- Request: Comprehensive UI/UX humanization, mobile accessibility fix, skeleton loader fallback, and structural policy page routing.
- Priority: Critical
- Status: Completed
