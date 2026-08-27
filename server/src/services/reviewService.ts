import { query, queryOne } from '../db/client'
import { NotFoundError, AuthError, ConflictError } from '../middleware/errorHandler'

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
  updatedAt: string
}

interface ReviewRow {
  id: string
  product_id: string
  user_id: string
  first_name: string
  last_name: string
  rating: number
  title: string
  content: string
  verified_purchase: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    authorName: `${row.first_name} ${row.last_name.charAt(0)}.`,
    rating: row.rating,
    title: row.title,
    content: row.content,
    verifiedPurchase: row.verified_purchase,
    isApproved: row.is_approved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const reviewService = {
  async getByProductId(productId: string): Promise<Review[]> {
    const rows = await query<ReviewRow>(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC`,
      [productId]
    )
    return rows.map(toReview)
  },

  async create(
    userId: string,
    productId: string,
    data: { rating: number; title: string; content: string }
  ): Promise<Review> {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId]
    )
    if (existing) throw new ConflictError('You have already reviewed this product')

    // Check if user purchased product
    const orderCheck = await queryOne<{ id: string }>(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'`,
      [userId, productId]
    )
    const verified = !!orderCheck

    const [row] = await query<ReviewRow>(
      `INSERT INTO reviews (product_id, user_id, rating, title, content, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, userId, data.rating, data.title, data.content, verified]
    )

    if (!row) throw new Error('Review creation failed')

    // Update product rating aggregate
    await this.recalculateProductRating(productId)

    const userRow = await queryOne<{ first_name: string; last_name: string }>(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    )

    return toReview({
      ...row,
      first_name: userRow?.first_name ?? 'User',
      last_name: userRow?.last_name ?? '',
    })
  },

  async update(
    userId: string,
    reviewId: string,
    data: { rating?: number; title?: string; content?: string }
  ): Promise<Review> {
    const existing = await queryOne<ReviewRow>(
      'SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = $1',
      [reviewId]
    )
    if (!existing) throw new NotFoundError('Review')
    if (existing.user_id !== userId) throw new AuthError('Unauthorized to modify this review')

    const [row] = await query<ReviewRow>(
      `UPDATE reviews
       SET rating  = COALESCE($1, rating),
           title   = COALESCE($2, title),
           content = COALESCE($3, content)
       WHERE id = $4
       RETURNING *`,
      [data.rating ?? null, data.title ?? null, data.content ?? null, reviewId]
    )

    if (!row) throw new NotFoundError('Review')
    await this.recalculateProductRating(row.product_id)

    return toReview({ ...row, first_name: existing.first_name, last_name: existing.last_name })
  },

  async delete(userId: string, reviewId: string, isAdmin = false): Promise<void> {
    const existing = await queryOne<{ user_id: string; product_id: string }>(
      'SELECT user_id, product_id FROM reviews WHERE id = $1',
      [reviewId]
    )
    if (!existing) throw new NotFoundError('Review')
    if (!isAdmin && existing.user_id !== userId) throw new AuthError('Unauthorized')

    await query('DELETE FROM reviews WHERE id = $1', [reviewId])
    await this.recalculateProductRating(existing.product_id)
  },

  async recalculateProductRating(productId: string): Promise<void> {
    const row = await queryOne<{ avg_rating: string; count: string }>(
      'SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = $1 AND is_approved = TRUE',
      [productId]
    )
    const avg = parseFloat(row?.avg_rating ?? '0')
    const count = parseInt(row?.count ?? '0', 10)

    await query('UPDATE products SET rating = $1, review_count = $2 WHERE id = $3', [avg, count, productId])
  },
}
