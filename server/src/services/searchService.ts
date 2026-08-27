import { query } from '../db/client'
import type { ProductListParams, PaginatedResponse, Product } from '../types'

// ─── Search Service ───────────────────────────────────────────────────────────
// Backed by PostgreSQL full-text search with GIN index on search_vector.
// Abstracted behind this service so the provider (Meilisearch, Algolia, etc.)
// can be swapped without touching any route or frontend code.

const SEARCH_BASE = `
  SELECT
    p.*,
    c.name AS category_name,
    c.slug AS category_slug,
    b.name AS brand_name,
    b.slug AS brand_slug,
    (SELECT url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image,
    COALESCE(ivs.stock_status, 'out-of-stock') AS stock_status,
    COALESCE(ivs.quantity_available, 0)         AS stock_available
  FROM products p
  LEFT JOIN categories c       ON c.id = p.category_id
  LEFT JOIN brands b           ON b.id = p.brand_id
  LEFT JOIN inventory_status ivs ON ivs.product_id = p.id
`

interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string
  description: string | null
  category_id: string
  category_name?: string
  category_slug?: string
  brand_id: string
  brand_name?: string
  brand_slug?: string
  price: string
  previous_price: string | null
  discount_percent: number
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  rating: string
  review_count: number
  wattage: number | null
  weight_grams: number | null
  primary_image?: string
  stock_status?: string
  stock_available?: string
  created_at: string
  updated_at: string
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    brandId: row.brand_id,
    brandName: row.brand_name,
    brandSlug: row.brand_slug,
    price: parseFloat(row.price),
    previousPrice: row.previous_price ? parseFloat(row.previous_price) : null,
    discountPercent: row.discount_percent,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    wattage: row.wattage,
    weightGrams: row.weight_grams,
    primaryImage: row.primary_image,
    stockStatus: (row.stock_status ?? 'out-of-stock') as Product['stockStatus'],
    stockAvailable: parseInt(row.stock_available ?? '0', 10),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const searchService = {
  /**
   * Full-text + filter search backed by PostgreSQL.
   * Future: swap implementation for Meilisearch/Typesense here.
   */
  async searchProducts(params: ProductListParams): Promise<PaginatedResponse<Product>> {
    const { page = 1, limit = 24, search, category, brand, minPrice, maxPrice, inStock, sort = 'rating_desc' } = params

    const where: string[] = ['p.is_active = TRUE']
    const args: unknown[] = []

    // Full-text search with ranking
    let rankSelect = ''
    if (search) {
      args.push(search)
      where.push(`p.search_vector @@ plainto_tsquery('english', $${args.length})`)
      rankSelect = `, ts_rank(p.search_vector, plainto_tsquery('english', $${args.length})) AS _rank`
    }

    if (category) {
      args.push(category)
      where.push(`(c.slug = $${args.length} OR c.id::text = $${args.length})`)
    }
    if (brand) {
      args.push(brand)
      where.push(`(b.slug = $${args.length} OR b.id::text = $${args.length})`)
    }
    if (minPrice !== undefined) {
      args.push(minPrice)
      where.push(`p.price >= $${args.length}`)
    }
    if (maxPrice !== undefined) {
      args.push(maxPrice)
      where.push(`p.price <= $${args.length}`)
    }
    if (inStock) {
      where.push(`ivs.quantity_available > 0`)
    }

    const whereSQL = `WHERE ${where.join(' AND ')}`

    const orderSQL = search
      ? 'ORDER BY _rank DESC, p.rating DESC'
      : sort === 'price_asc' ? 'ORDER BY p.price ASC'
      : sort === 'price_desc' ? 'ORDER BY p.price DESC'
      : sort === 'name_asc' ? 'ORDER BY p.name ASC'
      : sort === 'newest' ? 'ORDER BY p.created_at DESC'
      : 'ORDER BY p.rating DESC'

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c       ON c.id = p.category_id
       LEFT JOIN brands b           ON b.id = p.brand_id
       LEFT JOIN inventory_status ivs ON ivs.product_id = p.id
       ${whereSQL}`,
      args
    )
    const total = parseInt(countRows[0]?.count ?? '0', 10)
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    args.push(limit, offset)
    const rows = await query<ProductRow>(
      `${SEARCH_BASE.trim()} ${rankSelect} ${whereSQL} ${orderSQL} LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args
    )

    return {
      data: rows.map(toProduct),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    }
  },

  /**
   * Autocomplete suggestions based on product name prefix.
   */
  async suggest(q: string, limit = 8): Promise<Array<{ name: string; slug: string; category: string }>> {
    if (!q || q.length < 2) return []
    const rows = await query<{ name: string; slug: string; category_name: string }>(
      `SELECT p.name, p.slug, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = TRUE AND p.name ILIKE $1
       ORDER BY p.rating DESC
       LIMIT $2`,
      [`${q}%`, limit]
    )
    return rows.map((r) => ({ name: r.name, slug: r.slug, category: r.category_name }))
  },
}
