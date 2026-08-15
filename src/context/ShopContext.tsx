import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Product, CartItem, BuilderCategoryKey, Order } from '../types'
import { sampleOrders } from '../data'

interface Toast {
  id: string
  message: string
  type: 'cart' | 'wishlist' | 'info'
}

const MAX_COMPARE = 4

interface ShopContextType {
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  wishlist: Set<string>
  wishlistCount: number
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  compare: string[]
  compareCount: number
  toggleCompare: (productId: string) => void
  isInCompare: (productId: string) => boolean
  clearCompare: () => void
  orders: Order[]
  placeOrder: (order: Order) => void
  getOrder: (id: string) => Order | undefined
  builderSlots: Record<BuilderCategoryKey, Product | null>
  setBuilderSlot: (key: BuilderCategoryKey, product: Product | null) => void
  clearBuilder: () => void
  addBuildToCart: () => void
  builderTotal: number
  builderWattage: number
  toasts: Toast[]
  theme: 'dark' | 'light'
  toggleTheme: () => void
  showToast: (message: string, type?: 'cart' | 'wishlist' | 'info') => void
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

const INITIAL_BUILDER_SLOTS: Record<BuilderCategoryKey, Product | null> = {
  cpu: null,
  cooler: null,
  motherboard: null,
  memory: null,
  storage: null,
  videoCard: null,
  case: null,
  powerSupply: null,
}

export function ShopProvider({ children }: { children: ReactNode }) {
  // ── Cart State ──
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ── Wishlist State ──
  const [wishlist, setWishlist] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_wishlist')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  // ── PC Builder State ──
  const [builderSlots, setBuilderSlots] = useState<Record<BuilderCategoryKey, Product | null>>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_builder')
      return saved ? JSON.parse(saved) : INITIAL_BUILDER_SLOTS
    } catch {
      return INITIAL_BUILDER_SLOTS
    }
  })

  // ── Compare State ──
  const [compare, setCompare] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_compare')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ── Orders State (placed this session, persisted) ──
  const [placedOrders, setPlacedOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_orders')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ── Theme State (Dark / Light) ──
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

  // ── Toast State ──
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_cart', JSON.stringify(cart))
    } catch {}
  }, [cart])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_wishlist', JSON.stringify(Array.from(wishlist)))
    } catch {}
  }, [wishlist])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_builder', JSON.stringify(builderSlots))
    } catch {}
  }, [builderSlots])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_compare', JSON.stringify(compare))
    } catch {}
  }, [compare])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_orders', JSON.stringify(placedOrders))
    } catch {}
  }, [placedOrders])

  function showToast(message: string, type: 'cart' | 'wishlist' | 'info' = 'info') {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [...prev, { product, quantity }]
    })
    const shortName = product.name.length > 34 ? `${product.name.slice(0, 34)}…` : product.name
    showToast(`Added "${shortName}" to cart`, 'cart')
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
    showToast('Item removed from cart', 'info')
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartSubtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
        showToast('Removed from wishlist', 'wishlist')
      } else {
        next.add(productId)
        showToast('Saved to wishlist', 'wishlist')
      }
      return next
    })
  }

  const isInWishlist = (productId: string) => wishlist.has(productId)

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

  const placeOrder = (order: Order) => {
    setPlacedOrders((prev) => [order, ...prev])
  }

  const orders = [...placedOrders, ...sampleOrders]
  const getOrder = (id: string) => orders.find((o) => o.id === id)

  const setBuilderSlot = (key: BuilderCategoryKey, product: Product | null) => {
    setBuilderSlots((prev) => ({ ...prev, [key]: product }))
    if (product) {
      showToast(`Selected ${product.name.slice(0, 24)}... for ${key.toUpperCase()}`, 'info')
    }
  }

  const clearBuilder = () => {
    setBuilderSlots(INITIAL_BUILDER_SLOTS)
    showToast('PC Build cleared', 'info')
  }

  const addBuildToCart = () => {
    const selected = Object.values(builderSlots).filter(Boolean) as Product[]
    if (selected.length === 0) {
      showToast('No components selected in your build', 'info')
      return
    }
    selected.forEach((product) => addToCart(product, 1))
    showToast(`Added ${selected.length} custom build parts to your cart!`, 'cart')
  }

  const builderTotal = Object.values(builderSlots).reduce((sum, item) => (item ? sum + item.price : sum), 0)
  const builderWattage = Object.values(builderSlots).reduce((sum, item) => (item ? sum + (item.wattage || 75) : sum), 0)

  return (
    <ShopContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        wishlistCount: wishlist.size,
        toggleWishlist,
        isInWishlist,
        compare,
        compareCount: compare.length,
        toggleCompare,
        isInCompare,
        clearCompare,
        orders,
        placeOrder,
        getOrder,
        builderSlots,
        setBuilderSlot,
        clearBuilder,
        addBuildToCart,
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
