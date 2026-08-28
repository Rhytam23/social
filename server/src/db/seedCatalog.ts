// Imports the catalog snapshot (catalog.json, produced by scripts/exportCatalog.ts)
// into PostgreSQL as real product/brand/category/inventory records.
//
// Safety guarantees:
//   - Purely additive: ON CONFLICT DO NOTHING everywhere. Re-running never
//     overwrites admin edits, live stock levels, or existing rows.
//   - Images/specs/tags/benchmarks are only inserted for products this run created.
//   - Fabricated ratings/review counts are not present in the snapshot at all;
//     products start with rating 0 until real reviews accumulate.
//
// Run with: npm run seed:catalog

import fs from 'fs'
import path from 'path'
import { query, queryOne, checkDatabaseConnection, pool } from './client'

interface CatalogProduct {
  name: string
  slug: string
  sku: string
  brand: string
  category: string
  price: number
  previousPrice: number | null
  discountPercent: number
  stockCount: number
  image: string
  gallery: string[]
  description: string | null
  isNew: boolean
  isFeatured: boolean
  wattage: number | null
  specifications: Array<{ label: string; value: string }>
  tags: string[]
  performanceTier?: string
  fpsBenchmarks?: Array<{ game: string; fps1440p: number; fps4K: number }>
}

// Storefront category display names → canonical category slugs (001 seed set).
const CATEGORY_SLUGS: Record<string, string> = {
  'Gaming PCs': 'gaming-pcs',
  'Graphics Cards': 'gpus',
  'CPUs': 'cpus',
  'Motherboards': 'motherboards',
  'RAM': 'ram',
  'Storage': 'storage',
  'Cooling': 'cooling',
  'Cases': 'cases',
  'Power Supplies': 'psus',
  'Monitors': 'monitors',
  'Peripherals': 'peripherals',
  'Streaming': 'streaming',
  'Sim Racing': 'sim-racing',
  'Accessories': 'accessories',
  'Components': 'components',
  'Workstations': 'workstations',
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function ensureBrand(name: string): Promise<string> {
  const slug = slugify(name)
  const existing = await queryOne<{ id: string }>('SELECT id FROM brands WHERE slug = $1', [slug])
  if (existing) return existing.id
  const [row] = await query<{ id: string }>(
    `INSERT INTO brands (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO NOTHING RETURNING id`,
    [name, slug]
  )
  if (row) return row.id
  const raced = await queryOne<{ id: string }>('SELECT id FROM brands WHERE slug = $1', [slug])
  if (!raced) throw new Error(`Failed to ensure brand '${name}'`)
  return raced.id
}

async function ensureCategory(displayName: string): Promise<string> {
  const slug = CATEGORY_SLUGS[displayName] ?? slugify(displayName)
  const existing = await queryOne<{ id: string }>('SELECT id FROM categories WHERE slug = $1', [slug])
  if (existing) return existing.id
  const [row] = await query<{ id: string }>(
    `INSERT INTO categories (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO NOTHING RETURNING id`,
    [displayName, slug]
  )
  if (row) return row.id
  const raced = await queryOne<{ id: string }>('SELECT id FROM categories WHERE slug = $1', [slug])
  if (!raced) throw new Error(`Failed to ensure category '${displayName}'`)
  return raced.id
}

async function importProduct(p: CatalogProduct): Promise<'created' | 'skipped'> {
  const categoryId = await ensureCategory(p.category)
  const brandId = await ensureBrand(p.brand)

  const [created] = await query<{ id: string }>(
    `INSERT INTO products (
       name, slug, sku, description, category_id, brand_id, price, previous_price,
       discount_percent, is_featured, is_new, wattage, performance_tier
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      p.name, p.slug, p.sku, p.description, categoryId, brandId,
      p.price, p.previousPrice, p.discountPercent,
      p.isFeatured, p.isNew, p.wattage, p.performanceTier ?? null,
    ]
  )

  if (!created) return 'skipped' // slug or SKU already present — never overwrite

  const productId = created.id

  // Images: primary first, then gallery
  const images = [p.image, ...p.gallery]
  for (let i = 0; i < images.length; i++) {
    await query(
      `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [productId, images[i], p.name, i, i === 0]
    )
  }

  for (let i = 0; i < p.specifications.length; i++) {
    const spec = p.specifications[i]
    if (!spec) continue
    await query(
      `INSERT INTO product_specs (product_id, label, value, sort_order)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [productId, spec.label, spec.value, i]
    )
  }

  for (const tag of p.tags) {
    await query(
      'INSERT INTO product_tags (product_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [productId, tag]
    )
  }

  await query(
    `INSERT INTO inventory (product_id, quantity_on_hand, low_stock_threshold)
     VALUES ($1, $2, 5) ON CONFLICT (product_id) DO NOTHING`,
    [productId, p.stockCount]
  )

  if (p.fpsBenchmarks?.length) {
    for (let i = 0; i < p.fpsBenchmarks.length; i++) {
      const b = p.fpsBenchmarks[i]
      if (!b) continue
      await query(
        `INSERT INTO product_benchmarks (product_id, game, fps_1440p, fps_4k, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, b.game, b.fps1440p, b.fps4K, i]
      )
    }
  }

  return 'created'
}

async function seedCatalog() {
  const dbOk = await checkDatabaseConnection()
  if (!dbOk) {
    console.error('[Catalog Seed] Database connection failed. Aborting.')
    process.exit(1)
  }

  const file = path.resolve(__dirname, 'catalog.json')
  if (!fs.existsSync(file)) {
    console.error('[Catalog Seed] catalog.json not found. Run `npx tsx scripts/exportCatalog.ts` first.')
    process.exit(1)
  }

  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    products: CatalogProduct[]
    gamingPCs: CatalogProduct[]
  }

  const all = [...snapshot.products, ...snapshot.gamingPCs]
  console.log(`[Catalog Seed] Importing ${all.length} catalog items (additive, never overwrites)...`)

  let createdCount = 0
  let skippedCount = 0
  for (const p of all) {
    const result = await importProduct(p)
    if (result === 'created') createdCount++
    else skippedCount++
  }

  const totals = await queryOne<{ products: string; images: string; specs: string; inventory: string; benchmarks: string }>(
    `SELECT
       (SELECT COUNT(*) FROM products)           AS products,
       (SELECT COUNT(*) FROM product_images)     AS images,
       (SELECT COUNT(*) FROM product_specs)      AS specs,
       (SELECT COUNT(*) FROM inventory)          AS inventory,
       (SELECT COUNT(*) FROM product_benchmarks) AS benchmarks`
  )

  console.log(`[Catalog Seed] Done. Created: ${createdCount}, skipped (already present): ${skippedCount}`)
  console.log(`[Catalog Seed] DB totals — products: ${totals?.products}, images: ${totals?.images}, specs: ${totals?.specs}, inventory rows: ${totals?.inventory}, benchmarks: ${totals?.benchmarks}`)
  await pool.end()
}

seedCatalog().catch((err) => {
  console.error('[Catalog Seed] Error:', err)
  process.exit(1)
})
