import { apiClient } from './apiClient'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  isVisible: boolean
  productCount?: number
}

export const categoryService = {
  async list(): Promise<Category[]> {
    const { categories } = await apiClient.get<{ categories: Category[] }>('/api/categories')
    return categories
  },

  async getBySlug(slug: string): Promise<Category> {
    const { category } = await apiClient.get<{ category: Category }>(`/api/categories/${slug}`)
    return category
  },
}
