// Exports the storefront's static catalog (src/data/index.ts) into
// server/src/db/catalog.json for seedCatalog.ts to import into PostgreSQL.
//
// Deliberately NOT exported (fabricated demo data):
//   - rating / reviewCount  (products start at 0; real reviews rebuild them)
//   - embedded reviews      (fake "Verified Buyer" content)
//
// fpsBenchmarks ARE exported but are flagged in PRODUCTION_ECOMMERCE_AUDIT.md
// as marketing figures requiring client confirmation.
//
// Run with: npx tsx scripts/exportCatalog.ts

import fs from 'fs'
import path from 'path'
import { allProducts, gamingPCsData } from '../../src/data/index'

interface ExportedProduct {
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

function exportProduct(p: (typeof allProducts)[number]): ExportedProduct {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? '',
    brand: p.brand,
    category: p.category,
    price: p.price,
    previousPrice: p.previousPrice ?? null,
    discountPercent: p.discount ?? 0,
    stockCount: p.stockCount ?? 0,
    image: p.image,
    gallery: (p.gallery ?? []).filter((g) => g !== p.image),
    description: p.description ?? null,
    isNew: p.isNew ?? false,
    isFeatured: p.isFeatured ?? false,
    wattage: p.wattage ?? null,
    specifications: p.specifications ?? [],
    tags: p.tags ?? [],
  }
}

const products = allProducts.map(exportProduct)

const gamingPCs = gamingPCsData.map((pc) => ({
  ...exportProduct({ ...pc, sku: pc.sku ?? `PP-GPC-${pc.slug.slice(0, 12).toUpperCase()}` }),
  performanceTier: pc.performanceTier,
  fpsBenchmarks: pc.fpsBenchmarks,
}))

const out = { exportedAt: new Date().toISOString(), products, gamingPCs }
const target = path.resolve(__dirname, '../src/db/catalog.json')
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf8')
console.log(`[Export] Wrote ${products.length} products + ${gamingPCs.length} gaming PCs to ${target}`)
