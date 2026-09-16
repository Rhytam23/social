import { createContext, useContext, useState, type ReactNode } from 'react'

export const COOKIE_STORAGE_KEY = 'premium_pc_cookie_prefs'

export interface CookiePreferences {
  necessary: boolean // Always true
  analytics: boolean
  functional: boolean
  marketing: boolean
  consentGiven: boolean
  updatedAt?: string
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
  consentGiven: false,
}

interface CookieConsentContextType {
  prefs: CookiePreferences
  hasConsented: boolean
  acceptAll: () => void
  rejectOptional: () => void
  saveCustomPreferences: (newPrefs: { analytics: boolean; functional: boolean; marketing: boolean }) => void
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<CookiePreferences>(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          necessary: true,
          analytics: !!parsed.analytics,
          functional: !!parsed.functional,
          marketing: !!parsed.marketing,
          consentGiven: parsed.consentGiven ?? true, // If legacy stored without consentGiven flag, treat as consented
          updatedAt: parsed.updatedAt,
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PREFERENCES
  })

  const [isModalOpen, setIsModalOpen] = useState(false)

  const savePrefs = (updated: CookiePreferences) => {
    const finalPrefs: CookiePreferences = {
      ...updated,
      necessary: true,
      consentGiven: true,
      updatedAt: new Date().toISOString(),
    }
    setPrefs(finalPrefs)
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(finalPrefs))
    } catch {
      // Ignore storage error
    }
  }

  const acceptAll = () => {
    savePrefs({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
      consentGiven: true,
    })
    setIsModalOpen(false)
  }

  const rejectOptional = () => {
    savePrefs({
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
      consentGiven: true,
    })
    setIsModalOpen(false)
  }

  const saveCustomPreferences = (custom: { analytics: boolean; functional: boolean; marketing: boolean }) => {
    savePrefs({
      necessary: true,
      analytics: custom.analytics,
      functional: custom.functional,
      marketing: custom.marketing,
      consentGiven: true,
    })
    setIsModalOpen(false)
  }

  return (
    <CookieConsentContext.Provider
      value={{
        prefs,
        hasConsented: prefs.consentGiven,
        acceptAll,
        rejectOptional,
        saveCustomPreferences,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}
