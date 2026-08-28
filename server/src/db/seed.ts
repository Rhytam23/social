import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { query, checkDatabaseConnection } from './client'
import { config } from '../config'

async function seed() {
  console.log('[Seed] Checking database connection...')
  const dbOk = await checkDatabaseConnection()
  if (!dbOk) {
    console.error('[Seed] Database connection failed. Aborting seed.')
    process.exit(1)
  }

  console.log('[Seed] Starting database seeding...')

  // 1. Seed the bootstrap admin account.
  // - Password comes from SEED_ADMIN_PASSWORD (required in production).
  // - ON CONFLICT DO NOTHING: re-running the seed never resets a rotated
  //   password or role on an existing account.
  console.log('[Seed] Seeding admin user...')
  let adminPassword = process.env['SEED_ADMIN_PASSWORD']
  if (!adminPassword) {
    if (config.env === 'production') {
      console.error('[Seed] SEED_ADMIN_PASSWORD is required in production. Skipping admin user seeding.')
    } else {
      adminPassword = crypto.randomBytes(18).toString('base64url')
      console.log(`[Seed] Generated one-time dev admin password for admin@premiumpc.com: ${adminPassword}`)
      console.log('[Seed] (Set SEED_ADMIN_PASSWORD to control this. Shown only when the account is first created.)')
    }
  }

  if (adminPassword) {
    const adminPasswordHash = await bcrypt.hash(adminPassword, config.security.bcryptRounds)
    await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified)
      VALUES ('admin@premiumpc.com', $1, 'Admin', 'User', 'admin', 'active', TRUE)
      ON CONFLICT (email) DO NOTHING
    `, [adminPasswordHash])
  }

  // 2. Seed Categories
  console.log('[Seed] Seeding categories...')
  const categories = [
    { name: 'Gaming PCs', slug: 'gaming-pcs', desc: 'Prebuilt enthusiast PCs and custom workstations', image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&q=80', order: 1 },
    { name: 'Graphics Cards', slug: 'gpus', desc: 'NVIDIA GeForce & AMD Radeon GPUs', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80', order: 2 },
    { name: 'Processors', slug: 'cpus', desc: 'Intel Core & AMD Ryzen CPUs', image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&q=80', order: 3 },
    { name: 'Motherboards', slug: 'motherboards', desc: 'Intel LGA1700/LGA1851 & AMD AM5 Motherboards', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', order: 4 },
    { name: 'Memory (RAM)', slug: 'ram', desc: 'DDR5 & DDR4 High-Performance RAM', image: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=600&q=80', order: 5 },
    { name: 'Storage (SSDs)', slug: 'storage', desc: 'PCIe Gen 5 & Gen 4 M.2 NVMe SSDs', image: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=600&q=80', order: 6 },
    { name: 'Cooling', slug: 'cooling', desc: 'AIO Liquid Coolers, Air Coolers & Fans', image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80', order: 7 },
    { name: 'Cases & Chassis', slug: 'cases', desc: 'Panoramic Glass & Airflow PC Cases', image: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=600&q=80', order: 8 },
    { name: 'Power Supplies', slug: 'psus', desc: 'ATX 3.0 & 80+ Gold/Platinum Power Supplies', image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&q=80', order: 9 },
    { name: 'Monitors', slug: 'monitors', desc: '4K OLED & High Refresh Esports Monitors', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80', order: 10 },
    { name: 'Peripherals', slug: 'peripherals', desc: 'Gaming Keyboards, Mice & Headsets', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80', order: 11 },
    { name: 'Streaming Gear', slug: 'streaming', desc: 'Capture Cards, Microphones & Key Lights', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80', order: 12 },
  ]

  for (const c of categories) {
    await query(`
      INSERT INTO categories (name, slug, description, image_url, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        sort_order = EXCLUDED.sort_order
    `, [c.name, c.slug, c.desc, c.image, c.order])
  }

  // 3. Seed Brands
  console.log('[Seed] Seeding brands...')
  const brands = [
    { name: 'NVIDIA', slug: 'nvidia', logo: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200&q=80', order: 1 },
    { name: 'AMD', slug: 'amd', logo: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=200&q=80', order: 2 },
    { name: 'Intel', slug: 'intel', logo: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=200&q=80', order: 3 },
    { name: 'ASUS ROG', slug: 'asus-rog', logo: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80', order: 4 },
    { name: 'MSI', slug: 'msi', logo: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80', order: 5 },
    { name: 'Corsair', slug: 'corsair', logo: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=200&q=80', order: 6 },
    { name: 'NZXT', slug: 'nzxt', logo: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=200&q=80', order: 7 },
    { name: 'Samsung', slug: 'samsung', logo: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=200&q=80', order: 8 },
    { name: 'G.SKILL', slug: 'gskill', logo: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=200&q=80', order: 9 },
    { name: 'Crucial', slug: 'crucial', logo: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=200&q=80', order: 10 },
    { name: 'Gigabyte', slug: 'gigabyte', logo: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80', order: 11 },
    { name: 'Lian Li', slug: 'lian-li', logo: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=200&q=80', order: 12 },
  ]

  for (const b of brands) {
    await query(`
      INSERT INTO brands (name, slug, logo_url, sort_order)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        sort_order = EXCLUDED.sort_order
    `, [b.name, b.slug, b.logo, b.order])
  }

  // Fetch category & brand IDs for mapping
  const categoryMap = new Map<string, string>()
  const catRows = await query<{ id: string; slug: string }>('SELECT id, slug FROM categories')
  catRows.forEach(r => categoryMap.set(r.slug, r.id))

  const brandMap = new Map<string, string>()
  const brandRows = await query<{ id: string; slug: string }>('SELECT id, slug FROM brands')
  brandRows.forEach(r => brandMap.set(r.slug, r.id))

  // 4. Seed Products
  console.log('[Seed] Seeding sample products...')
  const sampleProducts = [
    {
      name: 'NVIDIA GeForce RTX 5090 Founders Edition 32GB GDDR7',
      slug: 'nvidia-geforce-rtx-5090-fe',
      sku: 'GPU-NV-5090-FE',
      description: 'The NVIDIA GeForce RTX 5090 delivers an unparalleled generational leap in gaming and workstation computing.',
      categorySlug: 'gpus',
      brandSlug: 'nvidia',
      price: 1999.99,
      prevPrice: null,
      discount: 0,
      isFeatured: true,
      isNew: true,
      wattage: 500,
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
      specs: [
        { label: 'VRAM', value: '32GB GDDR7' },
        { label: 'Memory Bus', value: '512-bit' },
        { label: 'CUDA Cores', value: '21,760' },
      ],
      tags: ['4K Ultra', 'Ray Tracing', 'DLSS 4'],
    },
    {
      name: 'ASUS ROG STRIX GeForce RTX 4090 OC 24GB GDDR6X',
      slug: 'asus-rog-strix-rtx-4090-oc-24gb',
      sku: 'GPU-ASUS-4090-ROG',
      description: 'The ROG Strix GeForce RTX 4090 brings a whole new meaning to going with the flow.',
      categorySlug: 'gpus',
      brandSlug: 'asus-rog',
      price: 1799.99,
      prevPrice: 1999.99,
      discount: 10,
      isFeatured: true,
      isNew: false,
      wattage: 450,
      image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
      specs: [
        { label: 'VRAM', value: '24GB GDDR6X' },
        { label: 'Boost Clock', value: '2640 MHz' },
      ],
      tags: ['4K Gaming', 'Ray Tracing', 'DLSS 3'],
    },
    {
      name: 'Intel Core i9-14900KS 3.2 GHz (6.2 GHz Turbo) 24-Core',
      slug: 'intel-core-i9-14900ks',
      sku: 'CPU-INTEL-14900KS',
      description: 'The world fastest desktop processor with 6.2 GHz Turbo clock.',
      categorySlug: 'cpus',
      brandSlug: 'intel',
      price: 649.99,
      prevPrice: 699.99,
      discount: 7,
      isFeatured: true,
      isNew: true,
      wattage: 253,
      image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
      specs: [
        { label: 'Cores / Threads', value: '24 Cores / 32 Threads' },
        { label: 'Max Turbo Frequency', value: '6.20 GHz' },
      ],
      tags: ['6.2 GHz', 'Overclocking', 'Extreme Gaming'],
    },
    {
      name: 'AMD Ryzen 7 7800X3D 8-Core 3D V-Cache Processor',
      slug: 'amd-ryzen-7-7800x3d',
      sku: 'CPU-AMD-7800X3D',
      description: 'The undisputed king of gaming processors with 96MB 3D V-Cache.',
      categorySlug: 'cpus',
      brandSlug: 'amd',
      price: 399.99,
      prevPrice: 449.99,
      discount: 11,
      isFeatured: true,
      isNew: false,
      wattage: 120,
      image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
      specs: [
        { label: 'Cores / Threads', value: '8 Cores / 16 Threads' },
        { label: 'Cache', value: '96 MB 3D V-Cache' },
      ],
      tags: ['3D V-Cache', 'Best for Gaming'],
    },
    {
      name: 'ASUS ROG MAXIMUS Z790 DARK HERO ATX Motherboard',
      slug: 'asus-rog-maximus-z790-dark-hero',
      sku: 'MB-ASUS-Z790-DH',
      description: 'The ROG Maximus Z790 Dark Hero delivers Wi-Fi 7 and PCIe 5.0 support.',
      categorySlug: 'motherboards',
      brandSlug: 'asus-rog',
      price: 699.99,
      prevPrice: null,
      discount: 0,
      isFeatured: true,
      isNew: true,
      wattage: 65,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      specs: [
        { label: 'Socket', value: 'LGA1700 / Intel Z790' },
        { label: 'Networking', value: 'Wi-Fi 7 + 2.5G LAN' },
      ],
      tags: ['Wi-Fi 7', 'PCIe 5.0'],
    },
  ]

  for (const p of sampleProducts) {
    const categoryId = categoryMap.get(p.categorySlug) ?? catRows[0]?.id
    const brandId = brandMap.get(p.brandSlug) ?? brandRows[0]?.id
    if (!categoryId || !brandId) continue

    // DO NOTHING: seeding must never clobber admin edits to existing products.
    const [prod] = await query<{ id: string }>(`
      INSERT INTO products (
        name, slug, sku, description, category_id, brand_id, price, previous_price,
        discount_percent, is_featured, is_new, wattage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `, [
      p.name, p.slug, p.sku, p.description, categoryId, brandId,
      p.price, p.prevPrice, p.discount, p.isFeatured, p.isNew, p.wattage,
    ])

    if (prod) {
      // Seed Primary Image
      await query(`
        INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
        VALUES ($1, $2, $3, 0, TRUE)
        ON CONFLICT DO NOTHING
      `, [prod.id, p.image, p.name])

      // Seed Specs
      for (let i = 0; i < p.specs.length; i++) {
        const spec = p.specs[i]
        if (!spec) continue
        await query(`
          INSERT INTO product_specs (product_id, label, value, sort_order)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [prod.id, spec.label, spec.value, i])
      }

      // Seed Inventory — never reset live stock levels on re-run
      await query(`
        INSERT INTO inventory (product_id, quantity_on_hand, low_stock_threshold)
        VALUES ($1, 50, 5)
        ON CONFLICT (product_id) DO NOTHING
      `, [prod.id])
    }
  }

  console.log('[Seed] Database seeding completed successfully!')
}

seed().catch((err) => {
  console.error('[Seed] Error seeding database:', err)
  process.exit(1)
})
