# PREMIUM PC — Hardware Retailer & Custom Rig Storefront

[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A high-performance, polished frontend client demonstration website for an enthusiast PC hardware retailer and custom system builder. UX-inspired by leading hardware e-commerce platforms like Caseking, designed with a dark, high-density **Technical Precision** design language (`#121317` primary background, `#007AFF` electric blue accent, thin geometric borders, crisp typography, and dense hardware presentations).

---

## 💻 Live Features & Demonstration Highlights

### ⚡ Storefront & Navigation
- **Multi-Level Mega Menu**: Deep-dive navigation across 16 hardware categories (Graphics Cards, CPUs, Motherboards, RAM, Storage, Cooling, Cases, Power Supplies, Gaming PCs, Monitors, etc.).
- **Utility Bar & Quick Header**: Instant access to B2B portal, order tracking, currency/language selectors, live stock status, and persistent cart/wishlist counters.
- **Frontend Search Engine**: Real-time dropdown search with instant product matches, category links, brand suggestions, and recent search history tracking.

### 🖥️ Interactive PC Builder (Configurator)
- **Component Slot Allocation**: Select CPU, CPU Cooler, Motherboard, Memory (RAM), GPU, NVMe Storage, Case, Power Supply, and Operating System.
- **Real-Time Compatibility Analysis**: Automatic socket validation (e.g. AMD AM5 vs Intel LGA1700/1851), wattage headroom calculations, and warning banners.
- **Performance Tier Estimator**: Dynamic 1080p, 1440p, and 4K FPS targets based on selected CPU & GPU combinations.
- **Export & Cart Integration**: One-click functionality to save builds to local storage, copy build specs to clipboard, or push all configured parts directly to the shopping cart.

### 🛍️ Hardware Catalog & Deep Filtering
- **Multi-Dimensional Filter Engine**: Filter products in real-time by Price, Manufacturer Brand, In-Stock Availability, Minimum Rating, GPU Chipset, CPU Series, RAM Speed, Storage Type, Form Factor, and Performance Tier.
- **Product Cards**: Consistent aspect ratios, stock badges, rating indicators, price comparison, discount callouts, and wishlist/compare toggles with layout-shift prevention.
- **Compare Drawer**: Side-by-side technical comparison for up to 4 hardware products.

### 📦 Product Detail Pages
- **Interactive Gallery**: Main image view with thumbnail switcher.
- **Comprehensive Specs Table**: Full technical specifications, TDP/wattage requirements, and SKU identifiers.
- **Customer Feedback System**: Verified customer reviews with interactive review submission form and community Q&A section.
- **Frequently Bought Together**: Dynamic bundle calculator with one-click "Add All to Cart" option.

### 🛒 Complete E-Commerce Flow
- **Shopping Cart**: Dynamic free-shipping progress meter, promo code validation (`HARDWARE10`), quantity adjustment, and item removal.
- **Demo Checkout Workflow**: Step-by-step checkout modal (Customer Details → Shipping Address & Method → Payment Options → Order Review).
- **Order Confirmation & Live Tracking**: Interactive order tracker with 5-stage dispatch timeline (Payment → Component Allocation → Stress & Thermal Burn-In → Courier Transit → Delivery).

### 🛡️ Customer Portal & Admin Demo
- **Customer Account Dashboard**: Order history, order details timeline, saved addresses, payment methods, wishlist, and profile settings.
- **Admin Management Console** (`/admin`): Dedicated administrative interface with business KPI counters (Revenue, Orders, Customers, Inventory), interactive Sales & Category Revenue Charts, product editor, inventory manager, promotions manager, and analytics reports.

---

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/) (Single-Page Application with lazy loading for Admin, Account, and specialized routes)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Vanilla CSS tokens, custom geometric borders, `#121317` palette)
- **Icons**: Google Material Symbols / Custom SVG Icons
- **State Management**: React Context API (`ShopContext`) with `localStorage` persistence

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm / yarn / pnpm

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/premium-pc-hardware.git
   cd premium-pc-hardware
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173/`

### Production Build

To verify typescript compilation and build the static production distribution:
```bash
npm run build
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## 📂 Project Structure

```
.
├── public/                 # Static public assets
├── src/
│   ├── assets/             # Images and styles
│   ├── components/
│   │   ├── home/           # Homepage hero, promo banners, brand & deals sections
│   │   ├── layout/         # Layout wrapper, Footer
│   │   ├── navigation/     # Header, MegaMenu, SearchBar, UtilityBar
│   │   ├── products/       # ProductCard, ProductGrid
│   │   └── ui/             # Reusable UI elements (Badges, StarRatings, Price, Charts)
│   ├── context/
│   │   └── ShopContext.tsx # Central store (Cart, Wishlist, PC Builder, Orders, Toasts)
│   ├── data/
│   │   └── index.ts        # Comprehensive mock dataset (products, categories, brands, orders)
│   ├── pages/
│   │   ├── account/        # Customer account dashboard & subpages
│   │   ├── admin/          # Admin console (Dashboard, Products, Orders, Inventory, Analytics)
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── DealsPage.tsx
│   │   ├── GamingPCsPage.tsx
│   │   ├── PCBuilderPage.tsx
│   │   ├── ProductDetailsPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── SearchPage.tsx
│   │   └── SupportPage.tsx
│   ├── types/              # TypeScript interfaces & domain models
│   ├── App.tsx             # Root component and router table
│   └── index.css           # Design tokens, typography & CSS utilities
├── vercel.json             # SPA rewrite configuration for Vercel deployment
├── vite.config.ts          # Vite build configuration
└── package.json
```

---

## ℹ️ Demo Limitations & Scope

- **Frontend Client Demonstration Only**: This project is built as a complete frontend showcase. No production backend infrastructure or live credit card payment processor (Stripe/PayPal API) is connected.
- **Mock Data**: All products, order numbers, shipping tracking statuses, and customer profiles use realistic mock datasets stored locally.
- **Session Persistence**: Cart items, saved wishlist items, active PC builder configurations, and newly placed orders persist in your browser's `localStorage`.

---

## 📄 License

MIT License — free for demonstration, commercial inspiration, and portfolio usage.
