import { apiClient } from './apiClient'

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

export const brandService = {
  async list(): Promise<Brand[]> {
    const { brands } = await apiClient.get<{ brands: Brand[] }>('/api/brands')
    return brands
  },

  async getBySlug(slug: string): Promise<Brand> {
    const { brand } = await apiClient.get<{ brand: Brand }>(`/api/brands/${slug}`)
    return brand
  },
}
