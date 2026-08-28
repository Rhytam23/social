import { apiClient } from './apiClient'
import type { ProductSummary, ProductListResult } from './productService'
import type { Category } from './categoryService'
import type { Brand } from './brandService'
import type { Order } from './orderService'
import type { User } from './authService'

// Every endpoint below is protected server-side by authenticate + role checks
// (requireStaff / requireAdmin). The UI gate is convenience only.

export interface DashboardSummary {
  recentOrders: Order[]
  userCount: number
  productCount: number
  lowStockCount: number
  paidRevenue: number
  paidOrderCount: number
  pendingOrderCount: number
  ordersByStatus: Array<{ status: string; count: number }>
}

export interface InventoryRecord {
  productId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  lowStockThreshold: number
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock'
  supplier: string | null
  restockEta: string | null
}

export interface CreateProductPayload {
  name: string
  slug?: string
  sku: string
  description?: string
  categoryId: string
  brandId: string
  price: number
  previousPrice?: number
  discountPercent?: number
  isActive?: boolean
  isFeatured?: boolean
  isNew?: boolean
  wattage?: number
  images?: Array<{ url: string; altText?: string; isPrimary?: boolean }>
  specs?: Array<{ label: string; value: string }>
  tags?: string[]
  inventory?: { quantityOnHand: number; lowStockThreshold?: number; supplier?: string }
}

export const adminService = {
  // ── Dashboard ──
  async dashboard(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>('/api/admin/dashboard')
  },

  // ── Products ──
  async listProducts(page = 1, limit = 24): Promise<ProductListResult> {
    return apiClient.get<ProductListResult>(`/api/admin/products?page=${page}&limit=${limit}`)
  },

  async createProduct(data: CreateProductPayload): Promise<ProductSummary> {
    const { product } = await apiClient.post<{ product: ProductSummary }>('/api/admin/products', data)
    return product
  },

  async updateProduct(id: string, data: Partial<CreateProductPayload>): Promise<ProductSummary> {
    const { product } = await apiClient.put<{ product: ProductSummary }>(`/api/admin/products/${id}`, data)
    return product
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/products/${id}`)
  },

  // ── Categories ──
  async listCategories(): Promise<Category[]> {
    const { categories } = await apiClient.get<{ categories: Category[] }>('/api/admin/categories')
    return categories
  },

  async createCategory(data: Partial<Category> & { name: string }): Promise<Category> {
    const { category } = await apiClient.post<{ category: Category }>('/api/admin/categories', data)
    return category
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const { category } = await apiClient.put<{ category: Category }>(`/api/admin/categories/${id}`, data)
    return category
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/categories/${id}`)
  },

  // ── Brands ──
  async listBrands(): Promise<Brand[]> {
    const { brands } = await apiClient.get<{ brands: Brand[] }>('/api/admin/brands')
    return brands
  },

  async createBrand(data: Partial<Brand> & { name: string }): Promise<Brand> {
    const { brand } = await apiClient.post<{ brand: Brand }>('/api/admin/brands', data)
    return brand
  },

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand> {
    const { brand } = await apiClient.put<{ brand: Brand }>(`/api/admin/brands/${id}`, data)
    return brand
  },

  async deleteBrand(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/brands/${id}`)
  },

  // ── Inventory ──
  async lowStock(): Promise<InventoryRecord[]> {
    const { records } = await apiClient.get<{ records: InventoryRecord[] }>('/api/admin/inventory/low-stock')
    return records
  },

  async getInventory(productId: string): Promise<InventoryRecord> {
    const { record } = await apiClient.get<{ record: InventoryRecord }>(`/api/admin/inventory/${productId}`)
    return record
  },

  async adjustInventory(
    productId: string,
    data: { quantityOnHand?: number; lowStockThreshold?: number; supplier?: string; restockEta?: string }
  ): Promise<InventoryRecord> {
    const { record } = await apiClient.put<{ record: InventoryRecord }>(`/api/admin/inventory/${productId}`, data)
    return record
  },

  // ── Orders ──
  async listOrders(page = 1, limit = 20, status?: string): Promise<{ orders: Order[]; total: number }> {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) q.set('status', status)
    return apiClient.get<{ orders: Order[]; total: number }>(`/api/admin/orders?${q.toString()}`)
  },

  async updateOrderStatus(id: string, status: string, description?: string): Promise<Order> {
    const { order } = await apiClient.put<{ order: Order }>(`/api/admin/orders/${id}/status`, { status, description })
    return order
  },

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<Order> {
    const { order } = await apiClient.put<{ order: Order }>(`/api/admin/orders/${id}/payment-status`, { paymentStatus })
    return order
  },

  // ── Users ──
  async listUsers(page = 1, limit = 20, role?: string): Promise<{ users: User[]; total: number }> {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (role) q.set('role', role)
    return apiClient.get<{ users: User[]; total: number }>(`/api/admin/users?${q.toString()}`)
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended' | 'deleted'): Promise<User> {
    const { user } = await apiClient.put<{ user: User }>(`/api/admin/users/${id}/status`, { status })
    return user
  },
}
