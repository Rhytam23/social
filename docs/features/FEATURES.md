# PREMIUM PC — Platform Feature Specification

This document details the complete feature set across the storefront, PC builder configurator, hardware catalog filtering, cart/checkout flows, customer account portal, and admin management console.

---

## 1. Storefront & Customer Navigation

- **Multi-Level Mega Menu**: Navigation across 16 hardware categories (Graphics Cards, CPUs, Motherboards, RAM, Storage, Cooling, Cases, Power Supplies, Prebuilt Gaming PCs, Monitors, Accessories, etc.).
- **Header Utility Bar**: Real-time stock status indicator, currency and language selectors, B2B inquiry link, and order tracking shortcut.
- **Frontend & API Search Engine**: Instant search bar with real-time dropdown matches for products, categories, and brand suggestions.
- **Bento Category Presentation**: Visual category tiles with product counts and high-density hardware displays.

---

## 2. Interactive PC Builder (Configurator Engine)

- **9 Component Slots**: CPU, CPU Cooler, Motherboard, Memory (RAM), GPU, Storage, Case, Power Supply, and OS.
- **Real-Time Compatibility Engine**: Automatic socket validation (AMD AM5 vs Intel LGA1700/1851), RAM slot matching, and form factor clearance checks.
- **Wattage & Power Headroom Calculator**: Dynamically sums component TDP requirements and calculates recommended PSU wattage headroom.
- **Performance FPS Estimator**: Displays estimated 1080p, 1440p, and 4K gaming framerates based on selected CPU & GPU combinations.
- **Build Management**: Save builds to local storage, copy build specs to clipboard, or push all configured parts directly to cart.

---

## 3. Product Catalog & Deep Filtering

- **Multi-Dimensional Filter Engine**: Filter products by Price Range, Brand Manufacturer, In-Stock Only toggle, Minimum Rating, Chipset, Socket, Memory Type, and Form Factor.
- **Product Cards**: High-density hardware presentation, stock status badges, discount callouts, ratings, wishlist toggle, and compare selection.
- **Comparison Drawer**: Side-by-side technical comparison for up to 4 hardware products.

---

## 4. Product Detail Pages (PDP)

- **Interactive Gallery**: High-resolution image viewer with thumbnail switcher.
- **Technical Specs Matrix**: Full hardware specifications including TDP, clock speeds, dimensions, and manufacturer warranty.
- **Reviews & Community Q&A**: Verified customer ratings, review submission modal, and Q&A section.
- **Frequently Bought Together (FBT)**: Dynamic bundle recommendations with one-click "Add All to Cart".

---

## 5. E-Commerce Checkout & Order Tracking

- **Shopping Cart**: Free shipping threshold progress meter, promo code entry (`HARDWARE10`), quantity adjustment, and subtotal calculation.
- **Multi-Step Checkout Modal**: Customer information → Delivery address → Payment options → Order summary.
- **Order Tracking Portal**: Interactive order tracker with 5-stage dispatch timeline (Payment → Component Allocation → Stress & Thermal Burn-In → Transit → Delivery).

---

## 6. Admin Management Console (`/admin`)

- **Business KPI Telemetry**: Real-time counter widgets for Total Revenue, Total Orders, Active Customers, Low-Stock Count, and Total Products.
- **Interactive Analytics Charts**: Sales trend graphs and category revenue distribution.
- **Product Management (`AdminProducts.tsx`)**: Product creation, editing, category assignment, price configuration, and deletion with confirmation dialog.
- **Inventory Control (`AdminInventory.tsx`)**: Real-time stock level monitoring, restock quantity adjustment modal, and low-stock alerts.
- **Order & Customer Management**: View customer profiles, manage order statuses, and filter transactions.
