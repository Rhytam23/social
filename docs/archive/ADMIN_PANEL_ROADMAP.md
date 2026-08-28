# PREMIUM PC — Admin Panel Implementation Roadmap

This document outlines the prioritization matrix for admin panel enhancements, categorized into pre-handoff fixes, launch requirements, and post-launch features.

---

## 1. MUST FIX BEFORE CLIENT HANDOFF

- [x] **Server-Side Authorization Verification**: Verify `authenticate` and `requireAdmin` / `requireStaff` middleware lock down all `/api/admin/*` endpoints.
- [x] **Real Data Telemetry**: Remove fake static multipliers (`customers.length * 24`) and fallback values from `AdminDashboard.tsx`. Connect KPI cards to real database queries.
- [x] **CSS Variable Standardization**: Standardize all CSS variable classes across admin pages from `bg-(--...)` to standard `bg-[var(--...)]`.
- [x] **Category Dependency Lock**: Ensure deleting a category with active hardware products returns a clear user notification and blocks deletion.
- [x] **Responsive Mobile Tables**: Wrap all data tables (`AdminOrders.tsx`, `AdminProducts.tsx`, `AdminCustomers.tsx`, `AdminInventory.tsx`) in `overflow-x-auto`.
- [x] **Destructive Action Confirmation**: Require confirmation modal before product, category, or brand deletion.

---

## 2. SHOULD FIX BEFORE LAUNCH

- [ ] **Admin Audit Logging**: Add `admin_audit_logs` table (`admin_id`, `action`, `target_type`, `target_id`, `created_at`) to log product deletion and price updates.
- [ ] **Batch Product Stock Adjustments**: Allow bulk stock quantity updates from the inventory list page.

---

## 3. POST-LAUNCH & OPTIONAL ENHANCEMENTS

- [ ] **Cloud Storage Upload Integration**: Wire direct binary file upload handler (Cloudinary / AWS S3) for admin product image management.
- [ ] **CSV / Excel Order Export**: Add button to download orders report as `.csv` file.
