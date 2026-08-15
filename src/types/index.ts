// ─── Product Types ───────────────────────────────────────────────────────────

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export type ProductCategory =
  | 'Gaming PCs'
  | 'Components'
  | 'Graphics Cards'
  | 'CPUs'
  | 'Motherboards'
  | 'RAM'
  | 'Storage'
  | 'Cooling'
  | 'Cases'
  | 'Power Supplies'
  | 'Monitors'
  | 'Peripherals'
  | 'Streaming'
  | 'Sim Racing'
  | 'Accessories'
  | 'Deals'
  | 'Workstations'

export interface ProductSpec {
  label: string
  value: string
}

export interface Review {
  id: string
  author: string
  rating: number
  title: string
  date: string
  verified: boolean
  content: string
}

export interface Product {
  id: string
  name: string
  brand: string
  category: ProductCategory
  price: number
  previousPrice?: number
  discount?: number
  rating: number
  reviewCount: number
  stockStatus: StockStatus
  image: string
  gallery?: string[]
  description?: string
  slug: string
  sku?: string
  isNew?: boolean
  isFeatured?: boolean
  specifications: ProductSpec[]
  tags?: string[]
  wattage?: number
  stockCount?: number
  reviews?: Review[]
}

// ─── Gaming PC Specific Types ─────────────────────────────────────────────────

export type PerformanceTier = 'Tier 1 - Esports' | 'Tier 2 - 1440p Pro' | 'Tier 3 - 4K Ultra' | 'Tier 4 - Enthusiast Extreme'

export interface GamingPC extends Product {
  cpu: string
  gpu: string
  ram: string
  storage: string
  caseName: string
  powerSupply: string
  coolingType: string
  performanceTier: PerformanceTier
  fpsBenchmarks: {
    game: string
    fps1440p: number
    fps4K: number
  }[]
}

// ─── Cart & Wishlist Types ────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
}

// ─── PC Builder Types ─────────────────────────────────────────────────────────

export type BuilderCategoryKey =
  | 'cpu'
  | 'cooler'
  | 'motherboard'
  | 'memory'
  | 'storage'
  | 'videoCard'
  | 'case'
  | 'powerSupply'

export interface BuilderSlot {
  key: BuilderCategoryKey
  name: string
  icon: string
  category: ProductCategory
  required: boolean
  selectedProduct: Product | null
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export interface NavSubItem {
  label: string
  href: string
  badge?: string
}

export interface NavColumn {
  title: string
  items: NavSubItem[]
}

export interface NavCategory {
  label: string
  href: string
  featuredImage?: string
  featuredLabel?: string
  columns?: NavColumn[]
}

// ─── Brand Types ──────────────────────────────────────────────────────────────

export interface Brand {
  id: string
  name: string
  logo?: string
  href: string
  description?: string
}

// ─── Deal Types ───────────────────────────────────────────────────────────────

export interface Deal {
  productId: string
  expiresAt: Date
  label: string
}

// ─── Promo Types ──────────────────────────────────────────────────────────────

export interface PromoCard {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image: string
  badge?: string
  size: 'large' | 'small'
}

// ─── Category Card Types ──────────────────────────────────────────────────────

export interface CategoryCard {
  id: string
  title: string
  itemCount: number
  image: string
  href: string
  startingPrice?: number
}

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus = 'Processing' | 'Assembling' | 'Quality Check' | 'Shipped' | 'Delivered'

export interface Order {
  id: string
  date: string
  status: OrderStatus
  trackingNumber: string
  estimatedDelivery: string
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  timeline: {
    status: OrderStatus
    date: string
    completed: boolean
    description: string
  }[]
  customerName?: string
  customerEmail?: string
  paymentMethod?: string
  paymentStatus?: 'Paid' | 'Pending' | 'Refunded'
}

// ─── Admin / Ops Types ────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  email: string
  avatarColor: string
  orders: number
  totalSpent: number
  registered: string
  status: 'Active' | 'VIP' | 'Inactive'
  location: string
}

export interface Coupon {
  id: string
  code: string
  description: string
  type: 'percent' | 'fixed'
  value: number
  status: 'Active' | 'Scheduled' | 'Expired'
  uses: number
  maxUses: number
  expires: string
}

export interface CategoryNode {
  id: string
  name: string
  slug: string
  href: string
  description: string
  image: string
  productCount: number
  visible: boolean
  subcategories: string[]
  popularBrands: string[]
}

export interface InventoryRow {
  product: Product
  reserved: number
  supplier: string
  restockEta: string
}
