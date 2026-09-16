import { useState, useEffect, useRef } from 'react'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { Icon } from './index'

export function CookieConsentBanner() {
  const {
    prefs,
    hasConsented,
    acceptAll,
    rejectOptional,
    saveCustomPreferences,
    isModalOpen,
    openModal,
    closeModal,
  } = useCookieConsent()

  const [draftPrefs, setDraftPrefs] = useState({
    analytics: prefs.analytics,
    functional: prefs.functional,
    marketing: prefs.marketing,
  })

  // Sync draft preferences when modal opens or prefs change
  useEffect(() => {
    setDraftPrefs({
      analytics: prefs.analytics,
      functional: prefs.functional,
      marketing: prefs.marketing,
    })
  }, [prefs, isModalOpen])

  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, closeModal])

  const handleSaveCustom = () => {
    saveCustomPreferences(draftPrefs)
  }

  return (
    <>
      {/* ── 1. Floating Cookie Consent Banner (Shown on first visit if not consented) ── */}
      {!hasConsented && (
        <div
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50 p-5 md:p-6 bg-(--bg-surface) border border-(--border-theme) rounded-2xl shadow-2xl select-none animate-fadeIn"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-(--accent-blue)/10 text-(--accent-blue) flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="cookie" size={20} />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-sm text-(--text-primary) tracking-tight">
                We value your privacy
              </h3>
              <p className="text-xs text-(--text-secondary) leading-relaxed">
                We use essential cookies to keep our store secure and functional. With your consent, we also use optional cookies for analytics, site performance, and personalized offers.
              </p>
              
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent-blue)"
                >
                  Accept All
                </button>

                <button
                  type="button"
                  onClick={rejectOptional}
                  className="px-4 py-2 bg-(--bg-primary) border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent-blue)"
                >
                  Reject Optional
                </button>

                <button
                  type="button"
                  onClick={openModal}
                  className="px-2 py-2 text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) underline underline-offset-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent-blue)"
                >
                  Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Cookie Preferences Detailed Modal ── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie Preferences Modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
        >
          <div
            ref={modalRef}
            className="bg-(--bg-surface) border border-(--border-theme) rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scaleUp"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-(--border-theme) pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-(--accent-blue)/10 text-(--accent-blue) flex items-center justify-center">
                  <Icon name="tune" size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-(--text-primary)">Cookie Preferences</h2>
                  <p className="text-[11px] font-mono text-(--text-secondary)">Manage your privacy settings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close preferences modal"
                className="text-(--text-secondary) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--bg-primary) transition-colors cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Description */}
            <p className="text-xs text-(--text-secondary) leading-relaxed">
              Essential cookies are always active to enable shopping cart, checkout, and security features. You can toggle optional categories below.
            </p>

            {/* Category Toggles */}
            <div className="space-y-4">
              {/* Necessary */}
              <div className="p-4 bg-(--bg-primary) border border-(--border-theme) rounded-xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-(--text-primary)">Strictly Necessary</span>
                    <span className="text-[10px] font-mono font-bold text-(--accent-blue) bg-(--accent-blue)/10 px-2 py-0.5 rounded-full">
                      Always Active
                    </span>
                  </div>
                  <p className="text-[11px] text-(--text-secondary) leading-relaxed">
                    Required for authentication, session security, shopping cart items, and checkout processing.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  aria-label="Strictly Necessary Cookies (Always Active)"
                  className="w-4 h-4 mt-1 accent-(--accent-blue) opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Analytics */}
              <div className="p-4 bg-(--bg-primary) border border-(--border-theme) rounded-xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-(--text-primary)">Analytics &amp; Performance</div>
                  <p className="text-[11px] text-(--text-secondary) leading-relaxed">
                    Allows anonymous statistical data collection to measure traffic, popular components, and website usage.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="cookie-analytics"
                  checked={draftPrefs.analytics}
                  onChange={(e) => setDraftPrefs({ ...draftPrefs, analytics: e.target.checked })}
                  aria-label="Toggle Analytics and Performance Cookies"
                  className="w-4 h-4 mt-1 accent-(--accent-blue) cursor-pointer"
                />
              </div>

              {/* Functional */}
              <div className="p-4 bg-(--bg-primary) border border-(--border-theme) rounded-xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-(--text-primary)">Functional &amp; Preferences</div>
                  <p className="text-[11px] text-(--text-secondary) leading-relaxed">
                    Remembers your theme preferences, PC builder scratchpad drafts, and custom UI preferences.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="cookie-functional"
                  checked={draftPrefs.functional}
                  onChange={(e) => setDraftPrefs({ ...draftPrefs, functional: e.target.checked })}
                  aria-label="Toggle Functional and Preferences Cookies"
                  className="w-4 h-4 mt-1 accent-(--accent-blue) cursor-pointer"
                />
              </div>

              {/* Marketing */}
              <div className="p-4 bg-(--bg-primary) border border-(--border-theme) rounded-xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-(--text-primary)">Marketing &amp; Targeting</div>
                  <p className="text-[11px] text-(--text-secondary) leading-relaxed">
                    Enables tailored hardware discounts, promotional campaigns, and relevant partner deals.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="cookie-marketing"
                  checked={draftPrefs.marketing}
                  onChange={(e) => setDraftPrefs({ ...draftPrefs, marketing: e.target.checked })}
                  aria-label="Toggle Marketing and Targeting Cookies"
                  className="w-4 h-4 mt-1 accent-(--accent-blue) cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-(--border-theme)">
              <button
                type="button"
                onClick={rejectOptional}
                className="w-full sm:w-auto px-4 py-2 bg-(--bg-primary) border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reject Optional
              </button>
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 sm:flex-none px-4 py-2 bg-(--accent-blue)/10 text-(--accent-blue) hover:bg-(--accent-blue)/20 font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex-1 sm:flex-none px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
