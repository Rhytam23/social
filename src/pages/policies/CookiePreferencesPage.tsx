import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { useShop } from '../../context/ShopContext'

const COOKIE_STORAGE_KEY = 'premium_pc_cookie_prefs'

export interface CookiePreferences {
  necessary: boolean // Always true
  analytics: boolean
  functional: boolean
  marketing: boolean
  updatedAt?: string
}

export function CookiePreferencesPage() {
  const { showToast } = useShop()

  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: true,
    marketing: false,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY)
      if (saved) {
        setPrefs(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const savePreferences = (newPrefs: CookiePreferences, toastMessage: string) => {
    const updated = { ...newPrefs, necessary: true, updatedAt: new Date().toISOString() }
    setPrefs(updated)
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(updated))
      showToast(toastMessage, 'cart')
    } catch {
      showToast('Failed to save cookie preferences', 'wishlist')
    }
  }

  const handleAcceptAll = () => {
    savePreferences({ necessary: true, analytics: true, functional: true, marketing: true }, 'Accepted all cookie preferences!')
  }

  const handleRejectOptional = () => {
    savePreferences({ necessary: true, analytics: false, functional: false, marketing: false }, 'Optional cookies declined.')
  }

  const handleSaveCustom = () => {
    savePreferences(prefs, 'Cookie preferences saved successfully!')
  }

  return (
    <main className="flex-1 w-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 md:px-6 py-10 md:py-16 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-6">
          <Link to="/" className="hover:text-[var(--text-primary)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-bold">COOKIE PREFERENCES</span>
        </nav>

        <header className="mb-10 border-b border-[var(--border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
            <Icon name="cookie" size={14} /> PRIVACY & CONTROL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Cookie Preferences
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed max-w-2xl">
            We use cookies to optimize site functionality, analyze traffic, and personalize your experience. Manage your settings below.
          </p>
          {prefs.updatedAt && (
            <p className="text-xs font-mono text-[var(--text-muted)] mt-2">
              Last saved: {new Date(prefs.updatedAt).toLocaleDateString()} at {new Date(prefs.updatedAt).toLocaleTimeString()}
            </p>
          )}
        </header>

        {/* Global Action Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-8 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl">
          <div>
            <span className="font-bold text-sm text-[var(--text-primary)] block">Quick Consent Actions</span>
            <span className="text-xs text-[var(--text-secondary)]">Choose one-click settings or customize categories below.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRejectOptional}
              className="px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              REJECT OPTIONAL
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              ACCEPT ALL
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {/* 1. Necessary */}
          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
                  <Icon name="shield" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Strictly Necessary Cookies</h3>
                  <span className="text-xs font-mono text-[var(--accent-blue)] font-semibold">REQUIRED — ALWAYS ENABLED</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-5 h-5 accent-[var(--accent-blue)] cursor-not-allowed opacity-70"
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-13">
              Essential for authenticating users, processing shopping cart checkouts, and maintaining platform security. These cannot be disabled.
            </p>
          </div>

          {/* 2. Functional */}
          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
                  <Icon name="tune" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Functional & Preference Cookies</h3>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">ENHANCED PERFORMANCE</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.functional}
                onChange={(e) => setPrefs({ ...prefs, functional: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-13">
              Remembers your selected theme (light/dark mode), custom PC builder drafts, language preferences, and currency filters.
            </p>
          </div>

          {/* 3. Analytics */}
          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
                  <Icon name="analytics" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Analytics & Performance Cookies</h3>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">USAGE METRICS</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-13">
              Collects aggregated, anonymous statistical data regarding page visit duration, hardware search query trends, and navigation flows.
            </p>
          </div>

          {/* 4. Marketing */}
          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
                  <Icon name="campaign" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Marketing & Targeting Cookies</h3>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">PERSONALIZED OFFERS</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-13">
              Used to display targeted component promotions, custom rig discounts, and relevant partner deals based on hardware browsing history.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex justify-end">
          <button
            onClick={handleSaveCustom}
            className="px-6 py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Icon name="save" size={16} /> SAVE PREFERENCES
          </button>
        </div>
      </div>
    </main>
  )
}
