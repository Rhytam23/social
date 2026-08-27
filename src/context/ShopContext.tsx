import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Product, CartItem, BuilderCategoryKey, Order, CategoryCard, Brand, GamingPC, Customer, OrderStatus } from '../types'
import { authService } from '../services/authService'
import {
  allProducts as initialProducts,
  featuredCategories as initialCategories,
  featuredBrands as initialBrands,
  gamingPCsData as initialGamingPCs,
  sampleOrders,
} from '../data'

export interface HeroCampaignState {
  id: string
  badge: string
  headlinePrimary: string
  headlineAccent: string
  description: string
  image: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
}

export interface MediaFile {
  id: string
  name: string
  url: string
  size: string
  uploadedAt: string
}

export interface StoreSettings {
  storeName: string
  contactEmail: string
  phone: string
  currency: string
  shippingRate: number
  freeShippingThreshold: number
  taxRate: number
}

interface Toast {
  id: string
  message: string
  type: 'cart' | 'wishlist' | 'info'
}

const MAX_COMPARE = 4

interface ShopContextType {
  // Cart & Shopping
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // Wishlist & Compare
  wishlist: Set<string>
  wishlistCount: number
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  compare: string[]
  compareCount: number
  toggleCompare: (productId: string) => void
  isInCompare: (productId: string) => boolean
  clearCompare: () => void

  // PC Builder
  builderSlots: Record<BuilderCategoryKey, Product | null>
  setBuilderSlot: (key: BuilderCategoryKey, product: Product | null) => void
  clearBuilder: () => void
  addBuildToCart: () => void
  builderTotal: number
  builderWattage: number

  // Admin Reactive State & Store Management
  products: Product[]
  addProduct: (product: Product) => void
  updateProduct: (product: Product) => void
  deleteProduct: (productId: string) => void
  duplicateProduct: (productId: string) => void

  categories: CategoryCard[]
  updateCategory: (category: CategoryCard) => void

  brands: Brand[]
  addBrand: (brand: Brand) => void
  updateBrand: (brand: Brand) => void
  deleteBrand: (brandId: string) => void

  gamingPCs: GamingPC[]
  addGamingPC: (pc: GamingPC) => void
  updateGamingPC: (pc: GamingPC) => void
  deleteGamingPC: (pcId: string) => void

  heroCampaign: HeroCampaignState
  updateHeroCampaign: (campaign: Partial<HeroCampaignState>) => void

  orders: Order[]
  placeOrder: (order: Order) => void
  getOrder: (id: string) => Order | undefined
  updateOrderStatus: (orderId: string, status: OrderStatus, paymentStatus?: 'Paid' | 'Pending' | 'Refunded') => void

  customers: Customer[]
  updateCustomerStatus: (customerId: string, status: 'Active' | 'VIP' | 'Inactive') => void

  mediaLibrary: MediaFile[]
  addMediaFile: (file: MediaFile) => void
  deleteMediaFile: (id: string) => void

  settings: StoreSettings
  updateSettings: (settings: Partial<StoreSettings>) => void

  // Admin Auth Protection
  isAdminLoggedIn: boolean
  loginAsAdmin: (password: string, email?: string) => Promise<boolean>
  logoutAdmin: () => void

  // UI Utilities
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

const DEFAULT_HERO_CAMPAIGN: HeroCampaignState = {
  id: 'rtx-5090-fe',
  badge: 'NEW ARRIVAL',
  headlinePrimary: 'NVIDIA RTX 5090',
  headlineAccent: 'FOUNDERS EDITION',
  description: 'Uncompromising performance for next-generation gaming.',
  image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1600&q=90',
  primaryCtaLabel: 'SHOP GAMING PCS',
  primaryCtaHref: '/gaming-pcs',
  secondaryCtaLabel: 'BUILD YOUR PC',
  secondaryCtaHref: '/builder',
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Alex Morgan', email: 'alex.m@example.com', avatarColor: '#007aff', orders: 4, totalSpent: 4899.96, registered: '2025-11-12', status: 'VIP', location: 'Seattle, WA' },
  { id: 'c2', name: 'Elena Rostova', email: 'elena.r@example.com', avatarColor: '#30d158', orders: 2, totalSpent: 2199.98, registered: '2026-01-04', status: 'Active', location: 'Austin, TX' },
  { id: 'c3', name: 'Marcus Chen', email: 'marcus.c@example.com', avatarColor: '#ff9500', orders: 1, totalSpent: 1299.99, registered: '2026-02-15', status: 'Active', location: 'Chicago, IL' },
  { id: 'c4', name: 'Sarah Jenkins', email: 'sarah.j@example.com', avatarColor: '#bf5af2', orders: 5, totalSpent: 7429.95, registered: '2025-08-20', status: 'VIP', location: 'New York, NY' },
  { id: 'c5', name: 'David Miller', email: 'david.m@example.com', avatarColor: '#ff453a', orders: 0, totalSpent: 0, registered: '2026-03-01', status: 'Inactive', location: 'Denver, CO' },
]

export function ShopProvider({ children }: { children: ReactNode }) {
  // ── Persistent Products State ──
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_products')
      return saved ? JSON.parse(saved) : initialProducts
    } catch {
      return initialProducts
    }
  })

  // ── Persistent Categories State ──
  const [categories, setCategories] = useState<CategoryCard[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_categories')
      return saved ? JSON.parse(saved) : initialCategories
    } catch {
      return initialCategories
    }
  })

  // ── Persistent Brands State ──
  const [brands, setBrands] = useState<Brand[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_brands')
      return saved ? JSON.parse(saved) : initialBrands
    } catch {
      return initialBrands
    }
  })

  // ── Persistent Gaming PCs State ──
  const [gamingPCs, setGamingPCs] = useState<GamingPC[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_gaming_pcs')
      return saved ? JSON.parse(saved) : initialGamingPCs
    } catch {
      return initialGamingPCs
    }
  })

  // ── Persistent Hero Campaign State ──
  const [heroCampaign, setHeroCampaign] = useState<HeroCampaignState>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_hero_campaign')
      return saved ? JSON.parse(saved) : DEFAULT_HERO_CAMPAIGN
    } catch {
      return DEFAULT_HERO_CAMPAIGN
    }
  })

  // ── Persistent Customers State ──
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_customers')
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS
    } catch {
      return INITIAL_CUSTOMERS
    }
  })

  // ── Persistent Settings State ──
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_settings')
      return saved
        ? JSON.parse(saved)
        : {
            storeName: 'PREMIUM PC',
            contactEmail: 'support@premiumpc.com',
            phone: '+1 (800) 555-4327',
            currency: 'USD ($)',
            shippingRate: 15,
            freeShippingThreshold: 500,
            taxRate: 8.5,
          }
    } catch {
      return {
        storeName: 'PREMIUM PC',
        contactEmail: 'support@premiumpc.com',
        phone: '+1 (800) 555-4327',
        currency: 'USD ($)',
        shippingRate: 15,
        freeShippingThreshold: 500,
        taxRate: 8.5,
      }
    }
  })

  // ── Media Library State ──
  const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_media')
      return saved
        ? JSON.parse(saved)
        : [
            { id: 'm1', name: 'rtx_5090_fe.png', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1600&q=90', size: '1.2 MB', uploadedAt: '2026-03-01' },
            { id: 'm2', name: 'i9_14900ks.png', url: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80', size: '850 KB', uploadedAt: '2026-03-02' },
            { id: 'm3', name: 'apex_rig.png', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80', size: '1.8 MB', uploadedAt: '2026-03-03' },
          ]
    } catch {
      return []
    }
  })

  // ── Admin Auth State ──
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('premium_pc_admin_auth') === 'true'
    } catch {
      return false
    }
  })

  const loginAsAdmin = async (password: string, email = 'admin@premiumpc.com'): Promise<boolean> => {
    try {
      const res = await authService.login(email, password)
      if (res.user.role === 'admin' || res.user.role === 'staff' || res.user.role === 'manager') {
        setIsAdminLoggedIn(true)
        try {
          localStorage.setItem('premium_pc_admin_auth', 'true')
        } catch {}
        showToast(`Authenticated as Administrator (${res.user.firstName})`, 'info')
        return true
      }
      showToast('Account does not have admin permissions', 'info')
      return false
    } catch {
      showToast('Invalid Administrator Credentials', 'info')
      return false
    }
  }

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false)
    try {
      localStorage.removeItem('premium_pc_admin_auth')
    } catch {}
    showToast('Logged out of Admin Console', 'info')
  }

  // ── Cart & Orders Persistence ──
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [wishlist, setWishlist] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_wishlist')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  const [builderSlots, setBuilderSlots] = useState<Record<BuilderCategoryKey, Product | null>>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_builder')
      return saved ? JSON.parse(saved) : INITIAL_BUILDER_SLOTS
    } catch {
      return INITIAL_BUILDER_SLOTS
    }
  })

  const [compare, setCompare] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_compare')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [placedOrders, setPlacedOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('premium_pc_orders')
      return saved ? JSON.parse(saved) : sampleOrders
    } catch {
      return sampleOrders
    }
  })

  // ── Theme State ──
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

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_products', JSON.stringify(products))
    } catch {}
  }, [products])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_categories', JSON.stringify(categories))
    } catch {}
  }, [categories])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_brands', JSON.stringify(brands))
    } catch {}
  }, [brands])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_gaming_pcs', JSON.stringify(gamingPCs))
    } catch {}
  }, [gamingPCs])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_hero_campaign', JSON.stringify(heroCampaign))
    } catch {}
  }, [heroCampaign])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_orders', JSON.stringify(placedOrders))
    } catch {}
  }, [placedOrders])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_customers', JSON.stringify(customers))
    } catch {}
  }, [customers])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_settings', JSON.stringify(settings))
    } catch {}
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem('premium_pc_media', JSON.stringify(mediaLibrary))
    } catch {}
  }, [mediaLibrary])

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

  const [toasts, setToasts] = useState<Toast[]>([])

  function showToast(message: string, type: 'cart' | 'wishlist' | 'info' = 'info') {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }

  // ── Product Operations ──
  const addProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev])
    showToast(`Added product "${product.name}"`, 'info')
  }

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    showToast(`Updated product "${updated.name}"`, 'info')
  }

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    showToast('Product deleted', 'info')
  }

  const duplicateProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId)
    if (!target) return
    const duplicated: Product = {
      ...target,
      id: `prod-${Date.now()}`,
      name: `${target.name} (Copy)`,
      slug: `${target.slug}-copy-${Date.now()}`,
    }
    addProduct(duplicated)
  }

  // ── Category Operations ──
  const updateCategory = (updated: CategoryCard) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    showToast(`Updated category "${updated.title}"`, 'info')
  }

  // ── Brand Operations ──
  const addBrand = (brand: Brand) => {
    setBrands((prev) => [...prev, brand])
    showToast(`Added brand "${brand.name}"`, 'info')
  }

  const updateBrand = (updated: Brand) => {
    setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    showToast(`Updated brand "${updated.name}"`, 'info')
  }

  const deleteBrand = (brandId: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== brandId))
    showToast('Brand deleted', 'info')
  }

  // ── Gaming PC Operations ──
  const addGamingPC = (pc: GamingPC) => {
    setGamingPCs((prev) => [pc, ...prev])
    showToast(`Added prebuilt rig "${pc.name}"`, 'info')
  }

  const updateGamingPC = (updated: GamingPC) => {
    setGamingPCs((prev) => prev.map((pc) => (pc.id === updated.id ? updated : pc)))
    showToast(`Updated rig "${updated.name}"`, 'info')
  }

  const deleteGamingPC = (pcId: string) => {
    setGamingPCs((prev) => prev.filter((pc) => pc.id !== pcId))
    showToast('Rig deleted', 'info')
  }

  // ── Hero Campaign Operations ──
  const updateHeroCampaign = (campaignPartial: Partial<HeroCampaignState>) => {
    setHeroCampaign((prev) => ({ ...prev, ...campaignPartial }))
    showToast('Updated homepage hero campaign', 'info')
  }

  // ── Order Operations ──
  const placeOrder = (order: Order) => {
    setPlacedOrders((prev) => [order, ...prev])
  }

  const getOrder = (id: string) => placedOrders.find((o) => o.id === id)

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: 'Paid' | 'Pending' | 'Refunded'
  ) => {
    setPlacedOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              paymentStatus: paymentStatus || o.paymentStatus,
              timeline: [
                ...o.timeline,
                { status, date: new Date().toISOString().split('T')[0], completed: true, description: `Status updated to ${status}` },
              ],
            }
          : o
      )
    )
    showToast(`Order #${orderId} status changed to ${status}`, 'info')
  }

  // ── Customer Operations ──
  const updateCustomerStatus = (customerId: string, status: 'Active' | 'VIP' | 'Inactive') => {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, status } : c)))
    showToast('Customer status updated', 'info')
  }

  // ── Media Operations ──
  const addMediaFile = (file: MediaFile) => {
    setMediaLibrary((prev) => [file, ...prev])
    showToast(`Uploaded asset "${file.name}"`, 'info')
  }

  const deleteMediaFile = (id: string) => {
    setMediaLibrary((prev) => prev.filter((f) => f.id !== id))
    showToast('Media file removed', 'info')
  }

  // ── Settings Operations ──
  const updateSettings = (partial: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
    showToast('Store settings updated', 'info')
  }

  // ── Cart Actions ──
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

  // ── Wishlist Actions ──
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

  // ── Compare Actions ──
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

  // ── Builder Actions ──
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
        builderSlots,
        setBuilderSlot,
        clearBuilder,
        addBuildToCart,
        builderTotal,
        builderWattage,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        categories,
        updateCategory,
        brands,
        addBrand,
        updateBrand,
        deleteBrand,
        gamingPCs,
        addGamingPC,
        updateGamingPC,
        deleteGamingPC,
        heroCampaign,
        updateHeroCampaign,
        orders: placedOrders,
        placeOrder,
        getOrder,
        updateOrderStatus,
        customers,
        updateCustomerStatus,
        mediaLibrary,
        addMediaFile,
        deleteMediaFile,
        settings,
        updateSettings,
        isAdminLoggedIn,
        loginAsAdmin,
        logoutAdmin,
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
