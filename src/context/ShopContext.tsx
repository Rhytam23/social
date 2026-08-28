import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ProductSummary } from '../services/productService'
import type { BuilderCategoryKey } from '../types'

// UI-only shop state. All catalog, cart, order, customer and settings data now
// comes from the backend API — nothing business-related is stored client-side.
// What remains here is genuinely local: toasts, theme, the compare tray, the
// PC-builder scratchpad, and a guest wishlist of product ids.

interface Toast {
  id: string
  message: string
  type: 'cart' | 'wishlist' | 'info'
}

const MAX_COMPARE = 4

const INITIAL_BUILDER_SLOTS: Record<BuilderCategoryKey, ProductSummary | null> = {
  cpu: null,
  cooler: null,
  motherboard: null,
  memory: null,
  storage: null,
  videoCard: null,
  case: null,
  powerSupply: null,
}

interface ShopContextType {
  // Compare tray (product ids)
  compare: string[]
  compareCount: number
  toggleCompare: (productId: string) => void
  isInCompare: (productId: string) => boolean
  clearCompare: () => void

  // PC Builder scratchpad
  builderSlots: Record<BuilderCategoryKey, ProductSummary | null>
  setBuilderSlot: (key: BuilderCategoryKey, product: ProductSummary | null) => void
  clearBuilder: () => void
  builderTotal: number
  builderWattage: number

  // UI utilities
  toasts: Toast[]
  theme: 'dark' | 'light'
  toggleTheme: () => void
  showToast: (message: string, type?: 'cart' | 'wishlist' | 'info') => void
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

function readJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [compare, setCompare] = useState<string[]>(() => readJSON('premium_pc_compare', []))
  const [builderSlots, setBuilderSlots] = useState<Record<BuilderCategoryKey, ProductSummary | null>>(
    () => readJSON('premium_pc_builder', INITIAL_BUILDER_SLOTS)
  )
  const [toasts, setToasts] = useState<Toast[]>([])

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_theme') as 'dark' | 'light' | null
      if (saved) return saved
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      }
      return 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_compare', JSON.stringify(compare))
    } catch {}
  }, [compare])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_builder', JSON.stringify(builderSlots))
    } catch {}
  }, [builderSlots])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_theme', theme)
    } catch {}
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  function showToast(message: string, type: 'cart' | 'wishlist' | 'info' = 'info') {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }

  // ── Compare ──
  const toggleCompare = (productId: string) => {
    setCompare((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from comparison', 'info')
        return prev.filter((id) => id !== productId)
      }
      if (prev.length >= MAX_COMPARE) {
        showToast(`You can compare up to ${MAX_COMPARE} products`, 'info')
        return prev
      }
      showToast('Added to comparison', 'info')
      return [...prev, productId]
    })
  }

  const isInCompare = (productId: string) => compare.includes(productId)
  const clearCompare = () => setCompare([])

  // ── Builder ──
  const setBuilderSlot = (key: BuilderCategoryKey, product: ProductSummary | null) => {
    setBuilderSlots((prev) => ({ ...prev, [key]: product }))
    if (product) {
      showToast(`Selected ${product.name.slice(0, 24)}… for ${key.toUpperCase()}`, 'info')
    }
  }

  const clearBuilder = () => {
    setBuilderSlots(INITIAL_BUILDER_SLOTS)
    showToast('PC Build cleared', 'info')
  }

  const builderTotal = Object.values(builderSlots).reduce((sum, item) => (item ? sum + item.price : sum), 0)
  const builderWattage = Object.values(builderSlots).reduce(
    (sum, item) => (item ? sum + (item.wattage || 75) : sum),
    0
  )

  return (
    <ShopContext.Provider
      value={{
        compare,
        compareCount: compare.length,
        toggleCompare,
        isInCompare,
        clearCompare,
        builderSlots,
        setBuilderSlot,
        clearBuilder,
        builderTotal,
        builderWattage,
        toasts,
        theme,
        toggleTheme,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}
