import { query } from '../db/client'
import type { Product } from '../types'
import { productService } from './productService'

export interface WishlistItem {
  userId: string
  productId: string
  addedAt: string
  product?: Product
}

export const wishlistService = {
  async getWishlist(userId: string): Promise<Product[]> {
    const rows = await query<{ product_id: string }>(
      'SELECT product_id FROM wishlist_items WHERE user_id = $1 ORDER BY added_at DESC',
      [userId]
    )

    if (rows.length === 0) return []

    const products = await Promise.all(
      rows.map((r) => productService.getById(r.product_id).catch(() => null))
    )

    return products.filter((p): p is Product => p !== null)
  },

  async getWishlistProductIds(userId: string): Promise<string[]> {
    const rows = await query<{ product_id: string }>(
      'SELECT product_id FROM wishlist_items WHERE user_id = $1',
      [userId]
    )
    return rows.map((r) => r.product_id)
  },

  async add(userId: string, productId: string): Promise<void> {
    // Verify product exists
    await productService.getById(productId)

    await query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    )
  },

  async remove(userId: string, productId: string): Promise<void> {
    await query(
      'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )
  },

  async clear(userId: string): Promise<void> {
    await query('DELETE FROM wishlist_items WHERE user_id = $1', [userId])
  },
}
