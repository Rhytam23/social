import { query, queryOne } from '../db/client'
import { NotFoundError, ConflictError } from '../middleware/errorHandler'
import type { Brand } from '../types'

interface BrandRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  website_url: string | null
  is_visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
  product_count?: string
}

function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    description: row.description,
    websiteUrl: row.website_url,
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
    productCount: row.product_count ? parseInt(row.product_count, 10) : undefined,
  }
}

export const brandService = {
  async list(visibleOnly = true): Promise<Brand[]> {
    const rows = await query<BrandRow>(
      `SELECT b.*,
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = TRUE) AS product_count
       FROM brands b
       WHERE ($1 = FALSE OR b.is_visible = TRUE)
       ORDER BY b.sort_order ASC, b.name ASC`,
      [visibleOnly]
    )
    return rows.map(toBrand)
  },

  async getBySlug(slug: string): Promise<Brand> {
    const row = await queryOne<BrandRow>(
      'SELECT * FROM brands WHERE slug = $1',
      [slug]
    )
    if (!row) throw new NotFoundError('Brand')
    return toBrand(row)
  },

  async getById(id: string): Promise<Brand> {
    const row = await queryOne<BrandRow>('SELECT * FROM brands WHERE id = $1', [id])
    if (!row) throw new NotFoundError('Brand')
    return toBrand(row)
  },

  async create(data: Partial<Brand> & { name: string }): Promise<Brand> {
    const slug = data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const existing = await queryOne<{ id: string }>('SELECT id FROM brands WHERE slug = $1', [slug])
    if (existing) throw new ConflictError(`Brand slug '${slug}' already exists`)

    const [row] = await query<BrandRow>(
      `INSERT INTO brands (name, slug, logo_url, description, website_url, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, slug, data.logoUrl ?? null, data.description ?? null,
       data.websiteUrl ?? null, data.isVisible ?? true, data.sortOrder ?? 0]
    )
    if (!row) throw new Error('Brand creation failed')
    return toBrand(row)
  },

  async update(id: string, data: Partial<Brand>): Promise<Brand> {
    const row = await queryOne<BrandRow>(
      `UPDATE brands
       SET name        = COALESCE($1, name),
           slug        = COALESCE($2, slug),
           logo_url    = COALESCE($3, logo_url),
           description = COALESCE($4, description),
           website_url = COALESCE($5, website_url),
           is_visible  = COALESCE($6, is_visible),
           sort_order  = COALESCE($7, sort_order)
       WHERE id = $8
       RETURNING *`,
      [data.name ?? null, data.slug ?? null, data.logoUrl ?? null,
       data.description ?? null, data.websiteUrl ?? null, data.isVisible ?? null,
       data.sortOrder ?? null, id]
    )
    if (!row) throw new NotFoundError('Brand')
    return toBrand(row)
  },

  async delete(id: string): Promise<void> {
    const productCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) FROM products WHERE brand_id = $1',
      [id]
    )
    if (parseInt(productCount?.count ?? '0', 10) > 0) {
      throw new ConflictError('Cannot delete brand with existing products.')
    }
    await query('DELETE FROM brands WHERE id = $1', [id])
  },
}
