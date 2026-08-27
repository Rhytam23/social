import { apiClient } from './apiClient'
import { config } from '../lib/config'

export interface PaginationParams {
  page?: number
  limit?: number
  category?: string
  brand?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isFeatured?: boolean
  isNew?: boolean
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'newest' | 'featured'
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ProductSummary {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  previousPrice: number | null
  discountPercent: number
  rating: number
  reviewCount: number
  primaryImage: string | null
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock'
  stockAvailable: number
  categoryName?: string
  brandName?: string
  isFeatured: boolean
  isNew: boolean
}

export interface ProductDetail extends ProductSummary {
  description: string | null
  specs: Array<{ label: string; value: string }>
  images: Array<{ url: string; altText: string | null; isPrimary: boolean }>
  tags?: string[]
  wattage: number | null
  categorySlug?: string
  brandSlug?: string
}

export interface ProductListResult {
  data: ProductSummary[]
  pagination: Pagination
}

function buildQuery(params: PaginationParams): string {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  else q.set('limit', String(config.app.defaultPageSize))
  if (params.category) q.set('category', params.category)
  if (params.brand) q.set('brand', params.brand)
  if (params.search) q.set('search', params.search)
  if (params.minPrice !== undefined) q.set('minPrice', String(params.minPrice))
  if (params.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice))
  if (params.inStock) q.set('inStock', 'true')
  if (params.isFeatured) q.set('isFeatured', 'true')
  if (params.isNew) q.set('isNew', 'true')
  if (params.sort) q.set('sort', params.sort)
  return q.toString() ? `?${q.toString()}` : ''
}

export const productService = {
  async list(params: PaginationParams = {}): Promise<ProductListResult> {
    return apiClient.get<ProductListResult>(`/api/products${buildQuery(params)}`, { auth: false })
  },

  async getBySlug(slug: string): Promise<ProductDetail> {
    const { product } = await apiClient.get<{ product: ProductDetail }>(`/api/products/${slug}`, { auth: false })
    return product
  },

  async search(params: PaginationParams): Promise<ProductListResult> {
    return apiClient.get<ProductListResult>(`/api/search${buildQuery(params)}`, { auth: false })
  },

  async suggest(q: string): Promise<Array<{ name: string; slug: string; category: string }>> {
    const { suggestions } = await apiClient.get<{ suggestions: Array<{ name: string; slug: string; category: string }> }>(
      `/api/search/suggest?q=${encodeURIComponent(q)}`,
      { auth: false }
    )
    return suggestions
  },

  async getFeatured(): Promise<ProductSummary[]> {
    const result = await this.list({ isFeatured: true, limit: 12 })
    return result.data
  },

  async getNewArrivals(): Promise<ProductSummary[]> {
    const result = await this.list({ isNew: true, sort: 'newest', limit: 8 })
    return result.data
  },
}
