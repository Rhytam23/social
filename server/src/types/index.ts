// ─── Shared Domain Types ──────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'staff' | 'manager'
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'
export type OrderStatus = 'processing' | 'assembling' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  avatarUrl: string | null
  googleId?: string | null
  githubId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  isVisible: boolean
  metaTitle: string | null
  metaDesc: string | null
  productCount?: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  websiteUrl: string | null
  isVisible: boolean
  sortOrder: number
  productCount?: number
}

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
}

// Manufacturer-supplied FPS figures for prebuilt systems.
export interface ProductBenchmark {
  game: string
  fps1440p: number | null
  fps4K: number | null
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  description: string | null
  categoryId: string
  categoryName?: string
  categorySlug?: string
  brandId: string
  brandName?: string
  brandSlug?: string
  price: number
  previousPrice: number | null
  discountPercent: number
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  rating: number
  reviewCount: number
  wattage: number | null
  weightGrams: number | null
  performanceTier?: string | null
  images?: ProductImage[]
  primaryImage?: string
  specs?: ProductSpec[]
  tags?: string[]
  benchmarks?: ProductBenchmark[]
  // Inventory (from join)
  stockStatus?: StockStatus
  stockAvailable?: number
  createdAt: string
  updatedAt: string
}

export interface InventoryRecord {
  productId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  lowStockThreshold: number
  stockStatus: StockStatus
  supplier: string | null
  restockEta: string | null
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  sku: string
  price: number
  quantity: number
  stockStatus: StockStatus
  stockAvailable: number
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  itemCount: number
}

export interface OrderLineItem {
  id: string
  productId: string | null
  productName: string      // snapshot
  productSku: string       // snapshot
  productImageUrl: string | null
  unitPrice: number        // snapshot — price at purchase time
  quantity: number
  discountAmount: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  userId: string | null
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  currency: string
  shippingName: string
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  trackingNumber: string | null
  estimatedDelivery: string | null
  customerEmail: string | null
  customerPhone: string | null
  items: OrderLineItem[]
  timeline: OrderTimelineEntry[]
  createdAt: string
  updatedAt: string
}

export interface OrderTimelineEntry {
  id: string
  status: string
  description: string | null
  createdAt: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userFirstName?: string
  userLastName?: string
  rating: number
  title: string
  content: string
  verifiedPurchase: boolean
  createdAt: string
}

// ─── API-Level Types ──────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string
  email: string
  role: UserRole
}

export interface JwtPayload extends AuthSession {
  iat: number
  exp: number
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ProductListParams extends PaginationParams {
  category?: string
  brand?: string
  search?: string
  ids?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isFeatured?: boolean
  isNew?: boolean
  hasDiscount?: boolean
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'newest' | 'featured'
}

export interface CreateOrderDTO {
  items: Array<{ productId: string; quantity: number }>
  shippingName: string
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  shippingMethod: 'standard' | 'express'
  paymentMethod: string
  customerEmail?: string
  customerPhone?: string
}

export interface CreateProductDTO {
  name: string
  slug: string
  sku: string
  description?: string
  categoryId: string
  brandId: string
  price: number
  previousPrice?: number
  costPrice?: number
  discountPercent?: number
  isActive?: boolean
  isFeatured?: boolean
  isNew?: boolean
  wattage?: number
  weightGrams?: number
  images?: Array<{ url: string; altText?: string; isPrimary?: boolean }>
  specs?: Array<{ label: string; value: string }>
  tags?: string[]
  inventory?: {
    quantityOnHand: number
    lowStockThreshold?: number
    supplier?: string
  }
}
