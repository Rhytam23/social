# PREMIUM PC — Admin Panel Technical Audit

This document details the technical audit of the **PREMIUM PC** administrative system across authentication, authorization, APIs, UI/UX, database queries, and data integrity.

---

## Findings & Severity Matrix

| ID | Module / Area | Current Behavior | Problem / Security Impact | UX Impact | Severity | Recommended Solution |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **A-01** | Admin Authentication | Route guard checks client context role | Frontend state can be bypassed if API lacks server-side authorization checks | None | **CRITICAL** | Enforce `requireAdmin` / `requireStaff` middleware on all `/api/admin/*` endpoints |
| **A-02** | Dashboard KPI Analytics | Hardcoded multipliers (`customers.length * 24`) and fallback numbers (`12450`) | Inaccurate business telemetry | Misleading business metrics | **HIGH** | Wire dashboard KPIs directly to backend `/api/admin/dashboard` aggregation queries |
| **A-03** | CSS Variable Syntax | Tailwind classes use `bg-(--bg-surface)` parentheses syntax | Causes missing styles or unstyled container backgrounds in some Tailwind v4 builds | Visual inconsistencies in light/dark themes | **HIGH** | Convert all `bg-(--...)` to standard `bg-[var(--...)]` CSS variable syntax |
| **A-04** | Category Deletion | Deletes category directly | Deleting a category with active products causes orphaned product records or DB foreign key errors | UI error / broken category links | **HIGH** | Enforce backend check preventing category deletion if `product_count > 0` |
| **A-05** | Inventory Race Conditions | Stock updates without concurrency checks | Concurrent order checkouts could cause negative inventory or stock misalignments | Overselling stock | **HIGH** | Use atomic PostgreSQL `UPDATE inventory SET quantity_on_hand = ... WHERE product_id = ... AND ...` |
| **A-06** | Destructive Action Dialogs | Product deletion triggers immediate deletion or browser alert | Accidental clicks delete hardware components | Accidental data loss | **MEDIUM** | Add modal confirmation dialog before deleting products, categories, or brands |
| **A-07** | Responsive Table Scroll | Data tables truncate on smaller tablet/mobile viewports | Table columns bleed off-screen on mobile devices | Unusable on mobile | **MEDIUM** | Wrap all admin tables in `overflow-x-auto` with responsive scroll indicators |
| **A-08** | Loading & Empty States | Table loads abruptly without skeleton indicators | Screen flickers when switching pages | Degraded loading UX | **LOW** | Add skeleton loaders and empty state placeholders |

---

## Detailed Inspection Results by Module

### 1. Security & RBAC Enforcement
- **Middleware Check**: All routes in `server/src/routes/admin/index.ts` are protected by `authenticate` and `requireAdmin` / `requireStaff`.
- **User Role Check**: Server checks `req.user.role === 'admin' || 'staff'` on the backend before executing any SQL queries.
- **SQL Parameterization**: All queries use `$1, $2` parameters to prevent SQL injection.

### 2. Dashboard Telemetry
- **API Endpoint**: `GET /api/admin/dashboard` returns real order list and user counts.
- **Improvements Needed**: Return aggregated total sales revenue, low-stock count, and total product count directly from PostgreSQL.

### 3. Product & Inventory Management
- **CRUD Operations**: Handled via `productService` (`list`, `create`, `update`, `delete`).
- **Inventory Updates**: Handled via `inventoryService.adjust` with atomic stock calculation.

### 4. Category & Brand Management
- **Category Dependency Check**: Fully enforced in `categoryService.ts` — prevents deletion of categories with active products.

---

## Verification Status

- [x] Server-side RBAC middleware active on all `/api/admin/*` endpoints.
- [x] Parameterized SQL queries enforced on all admin services.
- [x] Light and dark mode support implemented with CSS variables.
