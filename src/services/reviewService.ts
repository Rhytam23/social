import { apiClient } from './apiClient'

export interface Review {
  id: string
  productId: string
  userId: string
  authorName: string
  rating: number
  title: string
  content: string
  verifiedPurchase: boolean
  isApproved: boolean
  createdAt: string
}

export const reviewService = {
  async listForProduct(productId: string): Promise<Review[]> {
    const { reviews } = await apiClient.get<{ reviews: Review[] }>(`/api/products/${productId}/reviews`)
    return reviews
  },

  async create(
    productId: string,
    data: { rating: number; title: string; content: string }
  ): Promise<Review> {
    const { review } = await apiClient.post<{ review: Review }>(`/api/products/${productId}/reviews`, data)
    return review
  },
}
