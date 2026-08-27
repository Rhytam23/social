import { apiClient } from './apiClient'
import type { Product } from '../types'

export const wishlistService = {
  getWishlist: async (): Promise<{ wishlist: Product[]; wishlistIds: string[] }> => {
    return apiClient.get<{ wishlist: Product[]; wishlistIds: string[] }>('/api/wishlist')
  },

  addItem: async (productId: string): Promise<{ wishlistIds: string[] }> => {
    return apiClient.post<{ wishlistIds: string[] }>(`/api/wishlist/${productId}`)
  },

  removeItem: async (productId: string): Promise<{ wishlistIds: string[] }> => {
    return apiClient.delete<{ wishlistIds: string[] }>(`/api/wishlist/${productId}`)
  },

  clearWishlist: async (): Promise<void> => {
    return apiClient.delete<void>('/api/wishlist')
  },
}
