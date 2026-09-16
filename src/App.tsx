import { useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { ShopProvider, useShop } from './context/ShopContext'
import { CookieConsentProvider } from './context/CookieConsentContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/navigation/Header'
import { Footer } from './components/layout/Footer'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { MenuPage } from './pages/MenuPage'
import { ContactPage } from './pages/ContactPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Icon, CookieConsentBanner } from './components/ui'
import { PageSkeleton } from './components/ui/SkeletonLoader'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ScrollProgress } from './components/ui/ScrollProgress'

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
          className="flex items-center gap-2.5 px-4 py-3 bg-(--bg-surface) border border-(--border-theme) rounded-xl text-(--text-primary) text-xs font-mono shadow-2xl pointer-events-auto animate-fadeIn"
        >
          <Icon
            name="info"
            size={18}
            className="text-(--accent-green)"
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
    <div className="min-h-screen flex flex-col bg-(--bg-primary) text-(--text-primary)">
      <ScrollProgress />
      <Header />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <Footer />
      <CookieConsentBanner />
    </div>
  )
}

// ─── Main App Router ──────────────────────────────────────────────────────────

function AppContent() {
  return (
    <>
      <LoadingScreen />
      <ScrollToTop />
      <Routes>
        <Route element={<StorefrontLayout />}>
          {/* Core Required Café Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ShopProvider>
          <CookieConsentProvider>
            <AppContent />
          </CookieConsentProvider>
        </ShopProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
