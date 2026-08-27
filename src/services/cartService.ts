import { apiClient } from './apiClient'

export interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  sku: string
  price: number
  quantity: number
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock'
  stockAvailable: number
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  itemCount: number
}

export const cartService = {
  async getCart(): Promise<Cart> {
    const { cart } = await apiClient.get<{ cart: Cart }>('/api/cart')
    return cart
  },

  async addItem(productId: string, quantity = 1): Promise<Cart> {
    const { cart } = await apiClient.post<{ cart: Cart }>('/api/cart/items', { productId, quantity })
    return cart
  },

  async updateItem(productId: string, quantity: number): Promise<Cart> {
    const { cart } = await apiClient.put<{ cart: Cart }>(`/api/cart/items/${productId}`, { quantity })
    return cart
  },

  async removeItem(productId: string): Promise<Cart> {
    return this.updateItem(productId, 0)
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/api/cart')
  },
}
