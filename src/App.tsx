import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { ShopProvider, useShop } from './context/ShopContext'
import { Header } from './components/navigation/Header'
import { Footer } from './components/layout/Footer'
import { HomePage } from './components/home/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { CartPage } from './pages/CartPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Icon } from './components/ui'

// Lazy-loaded secondary areas (separate chunks)
const AdminApp = lazy(() => import('./pages/admin'))
const AccountApp = lazy(() => import('./pages/account'))
const GamingPCsPage = lazy(() => import('./pages/GamingPCsPage').then((m) => ({ default: m.GamingPCsPage })))
const GamingPCDetailsPage = lazy(() => import('./pages/GamingPCDetailsPage').then((m) => ({ default: m.GamingPCDetailsPage })))
const PCBuilderPage = lazy(() => import('./pages/PCBuilderPage').then((m) => ({ default: m.PCBuilderPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })))
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })))
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })))
const CategoryPage = lazy(() => import('./pages/CategoryPage').then((m) => ({ default: m.CategoryPage })))
const DealsPage = lazy(() => import('./pages/DealsPage').then((m) => ({ default: m.DealsPage })))
const ComparePage = lazy(() => import('./pages/ComparePage').then((m) => ({ default: m.ComparePage })))
const BrandPage = lazy(() => import('./pages/BrandPage').then((m) => ({ default: m.BrandPage })))
const BrandsPage = lazy(() => import('./pages/BrandPage').then((m) => ({ default: m.BrandsPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/policies/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsPage = lazy(() => import('./pages/policies/TermsPage').then((m) => ({ default: m.TermsPage })))
const ShippingPolicyPage = lazy(() => import('./pages/policies/ShippingPolicyPage').then((m) => ({ default: m.ShippingPolicyPage })))
const ReturnPolicyPage = lazy(() => import('./pages/policies/ReturnPolicyPage').then((m) => ({ default: m.ReturnPolicyPage })))
const AboutPage = lazy(() => import('./pages/policies/AboutPage').then((m) => ({ default: m.AboutPage })))
import { PageSkeleton } from './components/ui/SkeletonLoader'

// ─── Scroll to top on route navigation ────────────────────────────────────────

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// ─── Toast Notification Overlay ───────────────────────────────────────────────

function ToastContainer() {
  const { toasts } = useShop()
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-200 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 px-4 py-3 bg-surface-container border border-accent-blue rounded text-[#e3e2e7] text-xs font-mono shadow-2xl pointer-events-auto animate-fadeIn"
        >
          <Icon
            name={toast.type === 'cart' ? 'check_circle' : toast.type === 'wishlist' ? 'favorite' : 'info'}
            size={18}
            className={toast.type === 'wishlist' ? 'text-stock-red' : 'text-accent-blue'}
            filled={toast.type === 'wishlist'}
          />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Storefront Layout (Header + Footer) ──────────────────────────────────────

function PageFallback() {
  return <PageSkeleton />
}

function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121317] text-[#e3e2e7]">
      <Header />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <Footer />
    </div>
  )
}

// ─── Main App Router ──────────────────────────────────────────────────────────

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Admin (own chrome, no storefront header/footer, lazy chunk) ── */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#121317] flex items-center justify-center text-outline font-mono text-xs">Loading admin console…</div>}>
              <AdminApp />
            </Suspense>
          }
        />

        {/* ── Storefront ── */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />

          {/* Categories / listing */}
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/components" element={<ProductsPage />} />
          <Route path="/graphics-cards" element={<ProductsPage />} />
          <Route path="/cpus" element={<ProductsPage />} />
          <Route path="/motherboards" element={<ProductsPage />} />
          <Route path="/ram" element={<ProductsPage />} />
          <Route path="/storage" element={<ProductsPage />} />
          <Route path="/cooling" element={<ProductsPage />} />
          <Route path="/cases" element={<ProductsPage />} />
          <Route path="/power-supplies" element={<ProductsPage />} />
          <Route path="/monitors" element={<ProductsPage />} />
          <Route path="/peripherals" element={<ProductsPage />} />
          <Route path="/streaming" element={<ProductsPage />} />
          <Route path="/sim-racing" element={<ProductsPage />} />
          <Route path="/accessories" element={<ProductsPage />} />

          {/* Product details */}
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />

          {/* Specialized */}
          <Route path="/gaming-pcs" element={<GamingPCsPage />} />
          <Route path="/gaming-pc/:id" element={<GamingPCDetailsPage />} />
          <Route path="/builder" element={<PCBuilderPage />} />
          <Route path="/pc-builder" element={<PCBuilderPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/brand/:slug" element={<BrandPage />} />

          {/* Cart & checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />

          {/* Account (lazy chunk with its own nested routes) */}
          <Route path="/account/*" element={<AccountApp />} />

          {/* Orders / tracking */}
          <Route path="/orders" element={<OrderTrackingPage />} />
          <Route path="/track-order" element={<OrderTrackingPage />} />

          {/* Auth */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />

          {/* Support / policies */}
          <Route path="/support" element={<SupportPage />} />
          <Route path="/warranty" element={<SupportPage />} />
          <Route path="/b2b" element={<SupportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <AppContent />
      </ShopProvider>
    </BrowserRouter>
  )
}

export default App
