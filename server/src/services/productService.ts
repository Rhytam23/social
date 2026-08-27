import { query, queryOne, withTransaction } from '../db/client'
import { NotFoundError, ConflictError } from '../middleware/errorHandler'
import type { Product, ProductListParams, PaginatedResponse, CreateProductDTO } from '../types'

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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    stockAvailable: row.stock_available ? parseInt(row.stock_available, 10) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─── Core product list query (shared by list + search) ────────────────────────

const PRODUCT_BASE_SELECT = `
  SELECT
    p.*,
    c.name  AS category_name,
    c.slug  AS category_slug,
    b.name  AS brand_name,
    b.slug  AS brand_slug,
    (SELECT url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image,
    ivs.stock_status,
    ivs.quantity_available AS stock_available
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b     ON b.id = p.brand_id
  LEFT JOIN inventory_status ivs ON ivs.product_id = p.id
`

const SORT_CLAUSE: Record<string, string> = {
  price_asc:  'p.price ASC',
  price_desc: 'p.price DESC',
  rating_desc:'p.rating DESC, p.review_count DESC',
  name_asc:   'p.name ASC',
  newest:     'p.created_at DESC',
  featured:   'p.is_featured DESC, p.rating DESC',
}

export const productService = {
  async list(params: ProductListParams): Promise<PaginatedResponse<Product>> {
    const {
      page = 1, limit = 24,
      category, brand, search,
      minPrice, maxPrice,
      inStock, isFeatured, isNew,
      sort = 'featured',
    } = params

    const where: string[] = ['p.is_active = TRUE']
    const args: unknown[] = []

    if (category) {
      args.push(category)
      where.push(`(c.slug = $${args.length} OR c.id = $${args.length})`)
    }
    if (brand) {
      args.push(brand)
      where.push(`(b.slug = $${args.length} OR b.id = $${args.length})`)
    }
    if (search) {
      args.push(search)
      where.push(`p.search_vector @@ plainto_tsquery('english', $${args.length})`)
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
    if (isFeatured) {
      where.push(`p.is_featured = TRUE`)
    }
    if (isNew) {
      where.push(`p.is_new = TRUE`)
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orderSQL = `ORDER BY ${SORT_CLAUSE[sort] ?? SORT_CLAUSE['featured']}`

    // Count
    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b     ON b.id = p.brand_id
       LEFT JOIN inventory_status ivs ON ivs.product_id = p.id
       ${whereSQL}`,
      args
    )
    const total = parseInt(countRows[0]?.count ?? '0', 10)

    // Data
    const offset = (page - 1) * limit
    args.push(limit, offset)

    const rows = await query<ProductRow>(
      `${PRODUCT_BASE_SELECT} ${whereSQL} ${orderSQL} LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args
    )

    const totalPages = Math.ceil(total / limit)
    return {
      data: rows.map(toProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  },

  async getBySlug(slug: string): Promise<Product & { specs: Array<{ label: string; value: string }>; images: Array<{ url: string; altText: string | null; isPrimary: boolean }> }> {
    const row = await queryOne<ProductRow>(
      `${PRODUCT_BASE_SELECT} WHERE p.slug = $1 AND p.is_active = TRUE`,
      [slug]
    )
    if (!row) throw new NotFoundError('Product')

    const [specs, images] = await Promise.all([
      query<{ label: string; value: string }>(
        'SELECT label, value FROM product_specs WHERE product_id = $1 ORDER BY sort_order',
        [row.id]
      ),
      query<{ id: string; url: string; alt_text: string | null; sort_order: number; is_primary: boolean }>(
        'SELECT id, url, alt_text, sort_order, is_primary FROM product_images WHERE product_id = $1 ORDER BY sort_order',
        [row.id]
      ),
    ])

    return {
      ...toProduct(row),
      specs,
      images: images.map((i) => ({ id: i.id, url: i.url, altText: i.alt_text, sortOrder: i.sort_order, isPrimary: i.is_primary })),
    }
  },

  async getById(id: string): Promise<Product> {
    const row = await queryOne<ProductRow>(
      `${PRODUCT_BASE_SELECT} WHERE p.id = $1`,
      [id]
    )
    if (!row) throw new NotFoundError('Product')
    return toProduct(row)
  },

  async create(data: CreateProductDTO): Promise<Product> {
    const slug = data.slug ?? slugify(data.name)

    return withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM products WHERE slug = $1 OR sku = $2', [slug, data.sku])
      if (existing.rows.length > 0) throw new ConflictError('Product slug or SKU already exists')

      const { rows: [productRow] } = await client.query<ProductRow>(
        `INSERT INTO products
           (name, slug, sku, description, category_id, brand_id, price, previous_price, cost_price,
            discount_percent, is_active, is_featured, is_new, wattage, weight_grams)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [data.name, slug, data.sku, data.description ?? null, data.categoryId, data.brandId,
         data.price, data.previousPrice ?? null, data.costPrice ?? null,
         data.discountPercent ?? 0, data.isActive ?? true, data.isFeatured ?? false,
         data.isNew ?? true, data.wattage ?? null, data.weightGrams ?? null]
      )

      const productId = productRow.id

      // Images
      if (data.images?.length) {
        for (let i = 0; i < data.images.length; i++) {
          const img = data.images[i]
          await client.query(
            'INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES ($1,$2,$3,$4,$5)',
            [productId, img.url, img.altText ?? null, i, img.isPrimary ?? i === 0]
          )
        }
      }

      // Specs
      if (data.specs?.length) {
        for (let i = 0; i < data.specs.length; i++) {
          await client.query(
            'INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1,$2,$3,$4)',
            [productId, data.specs[i].label, data.specs[i].value, i]
          )
        }
      }

      // Tags
      if (data.tags?.length) {
        for (const tag of data.tags) {
          await client.query(
            'INSERT INTO product_tags (product_id, tag) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [productId, tag]
          )
        }
      }

      // Inventory
      const inv = data.inventory
      await client.query(
        `INSERT INTO inventory (product_id, quantity_on_hand, low_stock_threshold, supplier)
         VALUES ($1,$2,$3,$4)`,
        [productId, inv?.quantityOnHand ?? 0, inv?.lowStockThreshold ?? 5, inv?.supplier ?? null]
      )

      return toProduct(productRow)
    })
  },

  async update(id: string, data: Partial<CreateProductDTO>): Promise<Product> {
    const row = await queryOne<ProductRow>(
      `UPDATE products
       SET name             = COALESCE($1,  name),
           slug             = COALESCE($2,  slug),
           sku              = COALESCE($3,  sku),
           description      = COALESCE($4,  description),
           category_id      = COALESCE($5,  category_id),
           brand_id         = COALESCE($6,  brand_id),
           price            = COALESCE($7,  price),
           previous_price   = COALESCE($8,  previous_price),
           discount_percent = COALESCE($9,  discount_percent),
           is_active        = COALESCE($10, is_active),
           is_featured      = COALESCE($11, is_featured),
           is_new           = COALESCE($12, is_new),
           wattage          = COALESCE($13, wattage),
           weight_grams     = COALESCE($14, weight_grams)
       WHERE id = $15
       RETURNING *`,
      [data.name ?? null, data.slug ?? null, data.sku ?? null, data.description ?? null,
       data.categoryId ?? null, data.brandId ?? null, data.price ?? null,
       data.previousPrice ?? null, data.discountPercent ?? null,
       data.isActive ?? null, data.isFeatured ?? null, data.isNew ?? null,
       data.wattage ?? null, data.weightGrams ?? null, id]
    )
    if (!row) throw new NotFoundError('Product')
    return toProduct(row)
  },

  async delete(id: string): Promise<void> {
    const result = await query('UPDATE products SET is_active = FALSE WHERE id = $1', [id])
    if (!result) throw new NotFoundError('Product')
  },

  async hardDelete(id: string): Promise<void> {
    await query('DELETE FROM products WHERE id = $1', [id])
  },
}
