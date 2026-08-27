import { query, queryOne } from '../db/client'
import { NotFoundError, ConflictError } from '../middleware/errorHandler'
import type { Category } from '../types'

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_visible: boolean
  meta_title: string | null
  meta_desc: string | null
  created_at: string
  updated_at: string
  product_count?: string
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    metaTitle: row.meta_title,
    metaDesc: row.meta_desc,
    productCount: row.product_count ? parseInt(row.product_count, 10) : undefined,
  }
}

export const categoryService = {
  async list(visibleOnly = true): Promise<Category[]> {
    const rows = await query<CategoryRow>(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) AS product_count
       FROM categories c
       WHERE ($1 = FALSE OR c.is_visible = TRUE)
       ORDER BY c.sort_order ASC, c.name ASC`,
      [visibleOnly]
    )
    return rows.map(toCategory)
  },

  async getBySlug(slug: string): Promise<Category> {
    const row = await queryOne<CategoryRow>(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) AS product_count
       FROM categories c WHERE c.slug = $1`,
      [slug]
    )
    if (!row) throw new NotFoundError('Category')
    return toCategory(row)
  },

  async getById(id: string): Promise<Category> {
    const row = await queryOne<CategoryRow>(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    )
    if (!row) throw new NotFoundError('Category')
    return toCategory(row)
  },

  async create(data: Partial<Category> & { name: string }): Promise<Category> {
    const slug = data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const existing = await queryOne<{ id: string }>('SELECT id FROM categories WHERE slug = $1', [slug])
    if (existing) throw new ConflictError(`Category slug '${slug}' already exists`)

    const [row] = await query<CategoryRow>(
      `INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, slug, data.description ?? null, data.imageUrl ?? null,
       data.parentId ?? null, data.sortOrder ?? 0, data.isVisible ?? true]
    )
    if (!row) throw new Error('Category creation failed')
    return toCategory(row)
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const row = await queryOne<CategoryRow>(
      `UPDATE categories
       SET name        = COALESCE($1, name),
           slug        = COALESCE($2, slug),
           description = COALESCE($3, description),
           image_url   = COALESCE($4, image_url),
           parent_id   = COALESCE($5, parent_id),
           sort_order  = COALESCE($6, sort_order),
           is_visible  = COALESCE($7, is_visible)
       WHERE id = $8
       RETURNING *`,
      [data.name ?? null, data.slug ?? null, data.description ?? null,
       data.imageUrl ?? null, data.parentId ?? null, data.sortOrder ?? null,
       data.isVisible ?? null, id]
    )
    if (!row) throw new NotFoundError('Category')
    return toCategory(row)
  },

  async delete(id: string): Promise<void> {
    const productCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [id]
    )
    if (parseInt(productCount?.count ?? '0', 10) > 0) {
      throw new ConflictError('Cannot delete category with existing products. Reassign products first.')
    }
    await query('DELETE FROM categories WHERE id = $1', [id])
  },
}
