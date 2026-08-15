import type { Product, Brand, NavCategory, PromoCard, CategoryCard, GamingPC, StockStatus, Customer, Coupon, CategoryNode, Order, InventoryRow } from '../types'

// ─── Complete Navigation Data (16 Categories) ─────────────────────────────────

export const navCategories: NavCategory[] = [
  {
    label: 'Gaming PCs',
    href: '/gaming-pcs',
    columns: [
      {
        title: 'PREBUILT RIGS',
        items: [
          { label: 'Esports Ready (1080p)', href: '/gaming-pcs?tier=Tier%201' },
          { label: 'Performance Pro (1440p)', href: '/gaming-pcs?tier=Tier%202' },
          { label: 'Enthusiast 4K Ultra', href: '/gaming-pcs?tier=Tier%203' },
          { label: 'Apex Extreme Flagship', href: '/gaming-pcs?tier=Tier%204' },
        ],
      },
      {
        title: 'CUSTOM SYSTEMS',
        items: [
          { label: 'Interactive PC Configurator', href: '/builder', badge: 'NEW' },
          { label: 'Liquid Cooled Customs', href: '/gaming-pcs?type=liquid' },
          { label: 'Creator & 3D Render Rigs', href: '/gaming-pcs?type=workstation' },
          { label: 'Small Form Factor (ITX)', href: '/gaming-pcs?type=itx' },
        ],
      },
      {
        title: 'SYSTEM BRANDS',
        items: [
          { label: 'ASUS ROG Hyperion Rigs', href: '/products?brand=ASUS%20ROG' },
          { label: 'MSI MEG Trident Systems', href: '/products?brand=MSI' },
          { label: 'Corsair Vengeance PCs', href: '/products?brand=Corsair' },
          { label: 'NZXT Player Series', href: '/products?brand=NZXT' },
        ],
      },
    ],
  },
  {
    label: 'Components',
    href: '/components',
    columns: [
      {
        title: 'CORE PROCESSING',
        items: [
          { label: 'Graphics Cards (GPUs)', href: '/graphics-cards' },
          { label: 'Processors (CPUs)', href: '/cpus' },
          { label: 'Motherboards (Mainboards)', href: '/motherboards' },
          { label: 'DDR5 / DDR4 High-Speed RAM', href: '/ram' },
        ],
      },
      {
        title: 'STORAGE & POWER',
        items: [
          { label: 'PCIe Gen 5 / Gen 4 NVMe SSDs', href: '/storage' },
          { label: 'ATX 3.0 & Platinum Power Supplies', href: '/power-supplies' },
          { label: 'High Airflow Cases & Chassis', href: '/cases' },
          { label: 'Custom Cable Kits & Sleeves', href: '/accessories' },
        ],
      },
      {
        title: 'THERMAL MANAGEMENT',
        items: [
          { label: '360mm & 420mm AIO Coolers', href: '/cooling' },
          { label: 'High Static Pressure PWM Fans', href: '/cooling' },
          { label: 'Liquid Metal & Thermal Paste', href: '/cooling' },
          { label: 'Custom Loop Waterblocks', href: '/cooling' },
        ],
      },
    ],
  },
  {
    label: 'Graphics Cards',
    href: '/graphics-cards',
    columns: [
      {
        title: 'NVIDIA GEFORCE',
        items: [
          { label: 'GeForce RTX 5090 / 5080', href: '/graphics-cards?chipset=RTX%205090', badge: 'HOT' },
          { label: 'GeForce RTX 4090 OC 24GB', href: '/graphics-cards?chipset=RTX%204090' },
          { label: 'GeForce RTX 4080 Super 16GB', href: '/graphics-cards?chipset=RTX%204080' },
          { label: 'GeForce RTX 4070 Ti Super', href: '/graphics-cards?chipset=RTX%204070' },
        ],
      },
      {
        title: 'AMD RADEON',
        items: [
          { label: 'Radeon RX 7900 XTX 24GB', href: '/graphics-cards?chipset=RX%207900' },
          { label: 'Radeon RX 7900 XT 20GB', href: '/graphics-cards?chipset=RX%207900' },
          { label: 'Radeon RX 7800 XT 16GB', href: '/graphics-cards?chipset=RX%207800' },
        ],
      },
      {
        title: 'GPU PARTNERS',
        items: [
          { label: 'ASUS ROG Matrix & Strix', href: '/graphics-cards?brand=ASUS%20ROG' },
          { label: 'MSI SUPRIM X & Gaming Trio', href: '/graphics-cards?brand=MSI' },
          { label: 'Gigabyte AORUS Master', href: '/graphics-cards?brand=Gigabyte' },
        ],
      },
    ],
  },
  {
    label: 'CPUs',
    href: '/cpus',
    columns: [
      {
        title: 'INTEL DESKTOP',
        items: [
          { label: 'Core Ultra 9 285K (Arrow Lake)', href: '/cpus?brand=Intel', badge: 'NEW' },
          { label: 'Core i9-14900KS 6.2GHz', href: '/cpus?brand=Intel' },
          { label: 'Core i9-14900K 24-Core', href: '/cpus?brand=Intel' },
          { label: 'Core i7-14700K 20-Core', href: '/cpus?brand=Intel' },
        ],
      },
      {
        title: 'AMD RYZEN',
        items: [
          { label: 'Ryzen 7 7800X3D (Best Gaming)', href: '/cpus?brand=AMD', badge: 'TOP' },
          { label: 'Ryzen 9 7950X3D 16-Core', href: '/cpus?brand=AMD' },
          { label: 'Ryzen 9 9950X Zen 5', href: '/cpus?brand=AMD' },
          { label: 'Ryzen Threadripper 7000 Pro', href: '/cpus?brand=AMD' },
        ],
      },
    ],
  },
  {
    label: 'Motherboards',
    href: '/motherboards',
    columns: [
      {
        title: 'INTEL SOCKET (LGA1700 / LGA1851)',
        items: [
          { label: 'Intel Z790 / Z890 Flagship', href: '/motherboards?socket=Z790' },
          { label: 'Intel B760 Performance', href: '/motherboards?socket=B760' },
          { label: 'Overclocking Apex & Hero Boards', href: '/motherboards?brand=ASUS%20ROG' },
        ],
      },
      {
        title: 'AMD SOCKET (AM5)',
        items: [
          { label: 'AMD X670E / X870E Extreme', href: '/motherboards?socket=AM5' },
          { label: 'AMD B650E / B650 Gaming', href: '/motherboards?socket=AM5' },
          { label: 'Mini-ITX Compact AM5 Boards', href: '/motherboards?form=ITX' },
        ],
      },
    ],
  },
  {
    label: 'RAM',
    href: '/ram',
    columns: [
      {
        title: 'DDR5 SPEED GRADES',
        items: [
          { label: 'DDR5-8000+ Extreme Kits', href: '/ram?speed=8000' },
          { label: 'DDR5-7200 / 6400 Fast Low-Latency', href: '/ram?speed=7200' },
          { label: 'DDR5-6000 CL30 Sweet Spot', href: '/ram?speed=6000' },
        ],
      },
      {
        title: 'CAPACITY',
        items: [
          { label: '32GB Kits (2x16GB)', href: '/ram?cap=32' },
          { label: '64GB Kits (2x32GB / 4x16GB)', href: '/ram?cap=64' },
          { label: '128GB+ Pro Workstation Kits', href: '/ram?cap=128' },
        ],
      },
    ],
  },
  {
    label: 'Storage',
    href: '/storage',
    columns: [
      {
        title: 'SOLID STATE DRIVES (SSD)',
        items: [
          { label: 'PCIe 5.0 NVMe (14,000 MB/s)', href: '/storage?gen=5' },
          { label: 'PCIe 4.0 Pro NVMe SSDs', href: '/storage?gen=4' },
          { label: 'Heatsink Equipped PS5 & PC SSDs', href: '/storage?type=heatsink' },
          { label: '2TB & 4TB High Capacity', href: '/storage?cap=4tb' },
        ],
      },
    ],
  },
  {
    label: 'Cooling',
    href: '/cooling',
    columns: [
      {
        title: 'ALL-IN-ONE LIQUID COOLERS',
        items: [
          { label: '420mm / 360mm High Performance AIOs', href: '/cooling?type=aio' },
          { label: 'LCD Screen Integrated Coolers', href: '/cooling?type=lcd' },
          { label: 'Dual Tower Air Coolers', href: '/cooling?type=air' },
        ],
      },
      {
        title: 'CHASSIS FANS',
        items: [
          { label: 'Magnetic Daisy-Chain Fans', href: '/cooling?type=fans' },
          { label: 'Silent Industrial Noctua Fans', href: '/cooling?brand=Noctua' },
        ],
      },
    ],
  },
  {
    label: 'Cases',
    href: '/cases',
    columns: [
      {
        title: 'CHASSIS STYLES',
        items: [
          { label: 'Panoramic Glass Dual-Chamber Cases', href: '/cases?type=dual-chamber' },
          { label: 'High-Airflow Mesh Mid Towers', href: '/cases?type=mesh' },
          { label: 'Full Tower Extreme Watercooling Cases', href: '/cases?type=full' },
          { label: 'Compact Mini-ITX Travel Cases', href: '/cases?type=itx' },
        ],
      },
    ],
  },
  {
    label: 'Power Supplies',
    href: '/power-supplies',
    columns: [
      {
        title: 'WATTAGE & EFFICIENCY',
        items: [
          { label: '1600W / 1300W Titanium ATX 3.0', href: '/power-supplies?watt=1300' },
          { label: '1000W / 850W Platinum 12VHPWR', href: '/power-supplies?watt=1000' },
          { label: '750W / 650W Gold Modular', href: '/power-supplies?watt=750' },
          { label: 'SFX Small Form Factor PSUs', href: '/power-supplies?type=sfx' },
        ],
      },
    ],
  },
  {
    label: 'Monitors',
    href: '/monitors',
    columns: [
      {
        title: 'PANEL & RESOLUTION',
        items: [
          { label: 'OLED / QD-OLED Gaming Displays', href: '/monitors?panel=oled' },
          { label: '4K UHD 144Hz / 240Hz High DPI', href: '/monitors?res=4k' },
          { label: '1440p 240Hz / 360Hz Esports Pro', href: '/monitors?res=1440p' },
          { label: '34" - 49" Curved Ultrawide Monitors', href: '/monitors?type=ultrawide' },
        ],
      },
    ],
  },
  {
    label: 'Peripherals',
    href: '/peripherals',
    columns: [
      {
        title: 'GAMING GEAR',
        items: [
          { label: 'Magnetic Hall Effect Rapid Trigger Keyboards', href: '/peripherals?type=keyboard' },
          { label: 'Ultra-lightweight 8000Hz Wireless Mice', href: '/peripherals?type=mouse' },
          { label: 'Audiophile Planar Gaming Headsets', href: '/peripherals?type=headset' },
          { label: 'Cordura & Glass Speed Mousepads', href: '/peripherals?type=mousepad' },
        ],
      },
    ],
  },
  {
    label: 'Streaming',
    href: '/streaming',
    columns: [
      {
        title: 'CREATOR GEAR',
        items: [
          { label: '4K60 HDR Capture Cards', href: '/streaming?type=capture' },
          { label: 'Broadcast XLR Dynamic Microphones', href: '/streaming?type=mic' },
          { label: 'Studio Key Lights & Ring Lights', href: '/streaming?type=lights' },
          { label: 'Stream Decks & Macropads', href: '/streaming?type=control' },
        ],
      },
    ],
  },
  {
    label: 'Sim Racing',
    href: '/sim-racing',
    columns: [
      {
        title: 'RACING HARDWARE',
        items: [
          { label: 'Direct Drive Wheel Bases (20Nm+)', href: '/sim-racing?type=wheel' },
          { label: 'Load Cell & Hydraulic Pedals', href: '/sim-racing?type=pedals' },
          { label: 'Aluminum Profile Rig Chassis', href: '/sim-racing?type=cockpit' },
        ],
      },
    ],
  },
  {
    label: 'Accessories',
    href: '/accessories',
    columns: [
      {
        title: 'ESSENTIALS',
        items: [
          { label: 'Braided Cable Extensions', href: '/accessories' },
          { label: 'Anti-Sag GPU Brackets', href: '/accessories' },
          { label: 'Precision PC Toolkits & Drivers', href: '/accessories' },
          { label: 'Addressable RGB Controllers & Hubs', href: '/accessories' },
        ],
      },
    ],
  },
  {
    label: 'Deals',
    href: '/deals',
  },
]

// ─── Hero Promo Cards ─────────────────────────────────────────────────────────

export const heroPromos: PromoCard[] = [
  {
    id: 'rtx-5090',
    title: 'NVIDIA RTX 5090 FOUNDERS EDITION',
    subtitle: 'Absolute power. Unprecedented architecture. The new standard for 4K ray tracing and heavy computational workloads.',
    ctaLabel: 'VIEW SPECS',
    ctaHref: '/products/nvidia-geforce-rtx-5090-fe',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=80',
    badge: 'NEW ARRIVAL',
    size: 'large',
  },
  {
    id: 'i9-14900ks',
    title: 'INTEL CORE i9-14900KS',
    subtitle: '6.2 GHz Max Turbo. Push beyond limits.',
    ctaLabel: 'SHOP PROCESSORS',
    ctaHref: '/cpus',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
    size: 'small',
  },
  {
    id: 'apex-workstations',
    title: 'APEX WORKSTATIONS',
    subtitle: 'Pre-configured for rendering and ML.',
    ctaLabel: 'EXPLORE BUILDS',
    ctaHref: '/gaming-pcs',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
    size: 'small',
  },
]

// ─── Featured Categories ───────────────────────────────────────────────────────

export const featuredCategories: CategoryCard[] = [
  {
    id: 'gaming-pcs',
    title: 'Gaming PCs',
    itemCount: 42,
    href: '/gaming-pcs',
    startingPrice: 1199,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&q=80',
  },
  {
    id: 'gpus',
    title: 'Graphics Cards',
    itemCount: 247,
    href: '/graphics-cards',
    startingPrice: 249,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
  },
  {
    id: 'cpus',
    title: 'Processors',
    itemCount: 183,
    href: '/cpus',
    startingPrice: 129,
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&q=80',
  },
  {
    id: 'motherboards',
    title: 'Motherboards',
    itemCount: 312,
    href: '/motherboards',
    startingPrice: 89,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  },
  {
    id: 'ram',
    title: 'Memory (RAM)',
    itemCount: 164,
    href: '/ram',
    startingPrice: 59,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=600&q=80',
  },
  {
    id: 'storage',
    title: 'Storage (SSDs)',
    itemCount: 421,
    href: '/storage',
    startingPrice: 49,
    image: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=600&q=80',
  },
  {
    id: 'cooling',
    title: 'Cooling',
    itemCount: 156,
    href: '/cooling',
    startingPrice: 29,
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80',
  },
  {
    id: 'cases',
    title: 'Cases & Chassis',
    itemCount: 98,
    href: '/cases',
    startingPrice: 69,
    image: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=600&q=80',
  },
  {
    id: 'psus',
    title: 'Power Supplies',
    itemCount: 115,
    href: '/power-supplies',
    startingPrice: 79,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&q=80',
  },
  {
    id: 'monitors',
    title: 'Monitors',
    itemCount: 198,
    href: '/monitors',
    startingPrice: 199,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  },
  {
    id: 'peripherals',
    title: 'Peripherals',
    itemCount: 350,
    href: '/peripherals',
    startingPrice: 39,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  },
  {
    id: 'streaming',
    title: 'Streaming Gear',
    itemCount: 88,
    href: '/streaming',
    startingPrice: 49,
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80',
  },
]

// ─── Products Master Database ──────────────────────────────────────────────────

const rawProducts: Product[] = [
  {
    id: 'rtx-5090-fe',
    name: 'NVIDIA GeForce RTX 5090 Founders Edition 32GB GDDR7',
    brand: 'NVIDIA',
    category: 'Graphics Cards',
    price: 1999.99,
    rating: 5.0,
    reviewCount: 412,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
    ],
    slug: 'nvidia-geforce-rtx-5090-fe',
    isNew: true,
    isFeatured: true,
    wattage: 500,
    description: 'The NVIDIA GeForce RTX 5090 delivers an unparalleled generational leap in gaming and workstation computing. Powered by the groundbreaking Blackwell architecture and 32GB of high-bandwidth GDDR7 memory.',
    specifications: [
      { label: 'VRAM', value: '32GB GDDR7' },
      { label: 'Memory Bus', value: '512-bit' },
      { label: 'CUDA Cores', value: '21,760' },
      { label: 'Boost Clock', value: '2550 MHz' },
      { label: 'TDP / Recommended PSU', value: '500W (1000W PSU)' },
      { label: 'Outputs', value: '3x DisplayPort 2.1, 1x HDMI 2.1a' },
    ],
    tags: ['4K Ultra', 'Ray Tracing', 'DLSS 4', 'Blackwell', 'AI Workstation'],
    reviews: [
      {
        id: 'rev-1',
        author: 'Alexandre M.',
        rating: 5,
        title: 'Unbelievable 4K Performance in Cyberpunk',
        date: 'August 12, 2026',
        verified: true,
        content: 'Maintains 165+ FPS at native 4K with full path tracing turned on. Temperature stayed at 64C under 100% stress test. Worth every penny for enthusiast workstations.',
      },
    ],
  },
  {
    id: 'rtx-4090-asus-rog',
    name: 'ASUS ROG STRIX GeForce RTX 4090 OC 24GB GDDR6X',
    brand: 'ASUS ROG',
    category: 'Graphics Cards',
    price: 1799.99,
    previousPrice: 1999.99,
    discount: 10,
    rating: 4.9,
    reviewCount: 1283,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
    ],
    slug: 'asus-rog-strix-rtx-4090-oc-24gb',
    isFeatured: true,
    wattage: 450,
    description: 'The ROG Strix GeForce RTX 4090 brings a whole new meaning to going with the flow. Inside and out, every element of the card gives the monstrous GPU headroom to breathe freely and achieve peak performance.',
    specifications: [
      { label: 'VRAM', value: '24GB GDDR6X' },
      { label: 'Boost Clock', value: '2640 MHz (OC Mode)' },
      { label: 'TDP', value: '450W' },
      { label: 'Cooler', value: '3.5-Slot Axial-Tech Fans' },
      { label: 'Outputs', value: '3× DP 1.4a, 2× HDMI 2.1a' },
    ],
    tags: ['4K Gaming', 'Ray Tracing', 'DLSS 3'],
  },
  {
    id: 'msi-rtx-4080-super',
    name: 'MSI GeForce RTX 4080 SUPER 16GB SUPRIM X',
    brand: 'MSI',
    category: 'Graphics Cards',
    price: 999.99,
    previousPrice: 1149.99,
    discount: 13,
    rating: 4.8,
    reviewCount: 489,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
    slug: 'msi-rtx-4080-super-suprim-x',
    isFeatured: true,
    wattage: 320,
    specifications: [
      { label: 'VRAM', value: '16GB GDDR6X' },
      { label: 'Boost Clock', value: '2655 MHz' },
      { label: 'Memory Bus', value: '256-bit' },
      { label: 'TDP', value: '320W' },
    ],
    tags: ['4K Gaming', 'High Refresh', 'Silent Fan'],
  },
  {
    id: 'amd-rx-7900-xtx',
    name: 'AMD Radeon RX 7900 XTX 24GB Reference Edition',
    brand: 'AMD',
    category: 'Graphics Cards',
    price: 929.99,
    previousPrice: 999.99,
    discount: 7,
    rating: 4.7,
    reviewCount: 654,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
    slug: 'amd-radeon-rx-7900-xtx-24gb',
    wattage: 355,
    specifications: [
      { label: 'VRAM', value: '24GB GDDR6' },
      { label: 'Memory Bus', value: '384-bit' },
      { label: 'Stream Processors', value: '6,144' },
      { label: 'TDP', value: '355W' },
    ],
    tags: ['24GB VRAM', 'DisplayPort 2.1', 'RDNA 3'],
  },
  {
    id: 'intel-i9-14900ks',
    name: 'Intel Core i9-14900KS 3.2 GHz (6.2 GHz Turbo) 24-Core',
    brand: 'Intel',
    category: 'CPUs',
    price: 649.99,
    previousPrice: 699.99,
    discount: 7,
    rating: 4.9,
    reviewCount: 318,
    stockStatus: 'low-stock',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
    slug: 'intel-core-i9-14900ks',
    isNew: true,
    isFeatured: true,
    wattage: 253,
    description: 'The world fastest desktop processor. The Intel Core i9-14900KS pushes clock speeds up to an astonishing 6.2 GHz out of the box for the ultimate edge in gaming and heavy rendering pipelines.',
    specifications: [
      { label: 'Cores / Threads', value: '24 Cores (8P + 16E) / 32 Threads' },
      { label: 'Max Turbo Frequency', value: '6.20 GHz' },
      { label: 'Intel Smart Cache', value: '36 MB L3 + 32 MB L2' },
      { label: 'Base / Boost Power', value: '150W / 253W+' },
      { label: 'Socket Support', value: 'LGA1700 (Intel 600 & 700 Chipsets)' },
    ],
    tags: ['6.2 GHz', 'Overclocking', 'Extreme Gaming'],
  },
  {
    id: 'amd-ryzen-7-7800x3d',
    name: 'AMD Ryzen 7 7800X3D 8-Core 3D V-Cache Processor',
    brand: 'AMD',
    category: 'CPUs',
    price: 399.99,
    previousPrice: 449.99,
    discount: 11,
    rating: 5.0,
    reviewCount: 2841,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
    slug: 'amd-ryzen-7-7800x3d',
    isFeatured: true,
    wattage: 120,
    description: 'The undisputed king of gaming processors. With 96MB of ultra-fast 3D V-Cache, the Ryzen 7 7800X3D delivers record-shattering 1% low frame rates and smooth gameplay at incredible power efficiency.',
    specifications: [
      { label: 'Cores / Threads', value: '8 Cores / 16 Threads' },
      { label: 'Total L3 Cache', value: '96 MB 3D V-Cache' },
      { label: 'Max Boost Clock', value: '5.0 GHz' },
      { label: 'TDP', value: '120W' },
      { label: 'Socket', value: 'AM5 (PCIe 5.0 Support)' },
    ],
    tags: ['3D V-Cache', 'Best for Gaming', 'AM5 Platform'],
  },
  {
    id: 'intel-i7-14700k',
    name: 'Intel Core i7-14700K 20-Core (8P + 12E) Processor',
    brand: 'Intel',
    category: 'CPUs',
    price: 389.99,
    previousPrice: 419.99,
    discount: 7,
    rating: 4.8,
    reviewCount: 1145,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
    slug: 'intel-core-i7-14700k',
    wattage: 125,
    specifications: [
      { label: 'Cores / Threads', value: '20 Cores (8P + 12E) / 28 Threads' },
      { label: 'Max Turbo Frequency', value: '5.6 GHz' },
      { label: 'L3 Cache', value: '33 MB' },
      { label: 'Socket', value: 'LGA1700' },
    ],
    tags: ['Content Creation', 'High Performance', 'DDR5 Ready'],
  },
  {
    id: 'asus-rog-maximus-z790',
    name: 'ASUS ROG MAXIMUS Z790 DARK HERO ATX Motherboard',
    brand: 'ASUS ROG',
    category: 'Motherboards',
    price: 699.99,
    rating: 4.8,
    reviewCount: 452,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    slug: 'asus-rog-maximus-z790-dark-hero',
    isNew: true,
    isFeatured: true,
    wattage: 65,
    description: 'The ROG Maximus Z790 Dark Hero delivers robust power delivery, passive chipset cooling, Wi-Fi 7, and multiple PCIe 5.0 M.2 slots for unrestrained 14th Gen Intel Core performance.',
    specifications: [
      { label: 'Socket & Chipset', value: 'LGA1700 / Intel Z790' },
      { label: 'Power Stages', value: '20+1+2 Teamed Power Stages (90A)' },
      { label: 'Memory Support', value: '4x DDR5 up to 8000+ MHz (OC)' },
      { label: 'Storage Expansion', value: '1x PCIe 5.0 M.2 + 4x PCIe 4.0 M.2' },
      { label: 'Networking', value: 'Intel Wi-Fi 7 + 2.5Gb Ethernet' },
    ],
    tags: ['Wi-Fi 7', 'PCIe 5.0', 'DDR5-8000+', 'Thunderbolt 4'],
  },
  {
    id: 'msi-mag-x670e-tomahawk',
    name: 'MSI MAG X670E TOMAHAWK WIFI AM5 ATX Motherboard',
    brand: 'MSI',
    category: 'Motherboards',
    price: 279.99,
    previousPrice: 319.99,
    discount: 13,
    rating: 4.7,
    reviewCount: 890,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    slug: 'msi-mag-x670e-tomahawk-wifi',
    wattage: 50,
    specifications: [
      { label: 'Socket & Chipset', value: 'AM5 / AMD X670E' },
      { label: 'VRM Power', value: '14+2+1 Duet Rail Power System' },
      { label: 'Expansion', value: '1x PCIe 5.0 x16, 1x PCIe 5.0 M.2' },
      { label: 'Networking', value: 'Wi-Fi 6E + 2.5G LAN' },
    ],
    tags: ['AM5', 'PCIe 5.0', 'DDR5', 'Wi-Fi 6E'],
  },
  {
    id: 'corsair-dominator-titanium',
    name: 'Corsair DOMINATOR TITANIUM RGB 64GB (2x32GB) DDR5-6000 CL30',
    brand: 'Corsair',
    category: 'RAM',
    price: 289.99,
    previousPrice: 329.99,
    discount: 12,
    rating: 4.9,
    reviewCount: 780,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800&q=80',
    slug: 'corsair-dominator-titanium-ddr5-6000-64gb',
    isFeatured: true,
    wattage: 15,
    description: 'DOMINATOR TITANIUM features precision forged aluminum construction, customizable top bars, patented DHX cooling, and elite low-latency timing for uncompromised memory bandwidth.',
    specifications: [
      { label: 'Capacity', value: '64GB (2 x 32GB)' },
      { label: 'Speed & Latency', value: 'DDR5-6000 MHz (CL30-36-36-76)' },
      { label: 'Voltage', value: '1.35V Intel XMP 3.0 & AMD EXPO' },
      { label: 'Cooling', value: 'Solid Die-Cast Aluminum with DHX Heatpipe' },
    ],
    tags: ['DDR5-6000', 'CL30 Low Latency', 'Intel XMP / AMD EXPO', 'RGB'],
  },
  {
    id: 'gskill-trident-z5-rgb',
    name: 'G.SKILL Trident Z5 RGB 32GB (2x16GB) DDR5-7200 CL34',
    brand: 'G.SKILL',
    category: 'RAM',
    price: 159.99,
    previousPrice: 189.99,
    discount: 16,
    rating: 4.8,
    reviewCount: 934,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800&q=80',
    slug: 'gskill-trident-z5-rgb-ddr5-7200-32gb',
    wattage: 12,
    specifications: [
      { label: 'Capacity', value: '32GB (2x16GB)' },
      { label: 'Speed', value: 'DDR5-7200' },
      { label: 'Latency', value: 'CL34-45-45-115' },
    ],
    tags: ['DDR5-7200', 'High Frequency', 'RGB'],
  },
  {
    id: 'crucial-t700-gen5-2tb',
    name: 'Crucial T700 2TB PCIe Gen5 NVMe M.2 SSD with Heatsink',
    brand: 'Crucial',
    category: 'Storage',
    price: 249.99,
    previousPrice: 299.99,
    discount: 17,
    rating: 4.9,
    reviewCount: 512,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=800&q=80',
    slug: 'crucial-t700-pcie-gen5-2tb',
    isFeatured: true,
    wattage: 10,
    description: 'Experience blistering read/write speeds up to 12,400/11,800 MB/s. Built with Micron 232-layer TLC NAND and an engineered premium aluminum/copper heatsink for thermal regulation.',
    specifications: [
      { label: 'Sequential Read', value: 'Up to 12,400 MB/s' },
      { label: 'Sequential Write', value: 'Up to 11,800 MB/s' },
      { label: 'Interface', value: 'PCIe Gen 5.0 x4, NVMe 2.0' },
      { label: 'Endurance (TBW)', value: '1,200 TBW' },
      { label: 'Form Factor', value: 'M.2 2280 with Custom Heatsink' },
    ],
    tags: ['PCIe 5.0', '12400 MB/s', 'Heatsink Included', 'DirectStorage'],
  },
  {
    id: 'samsung-990-pro-4tb',
    name: 'Samsung 990 PRO 4TB PCIe 4.0 NVMe M.2 SSD',
    brand: 'Samsung',
    category: 'Storage',
    price: 319.99,
    previousPrice: 379.99,
    discount: 16,
    rating: 4.9,
    reviewCount: 3890,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=800&q=80',
    slug: 'samsung-990-pro-nvme-4tb',
    wattage: 8,
    specifications: [
      { label: 'Read Speed', value: '7,450 MB/s' },
      { label: 'Write Speed', value: '6,900 MB/s' },
      { label: 'Capacity', value: '4,000 GB (4TB)' },
    ],
    tags: ['4TB Capacity', 'Samsung Pascal Controller', 'V-NAND TLC'],
  },
  {
    id: 'nzxt-kraken-elite-360',
    name: 'NZXT Kraken Elite 360 RGB LCD Liquid Cooler (Black)',
    brand: 'NZXT',
    category: 'Cooling',
    price: 279.99,
    previousPrice: 299.99,
    discount: 7,
    rating: 4.8,
    reviewCount: 1420,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    slug: 'nzxt-kraken-elite-360-rgb-lcd',
    isFeatured: true,
    wattage: 25,
    description: 'Display system telemetry, custom GIFs, or performance charts in vivid color on the 2.36-inch wide-angle LCD screen with 640x640 resolution and 60 Hz refresh rate.',
    specifications: [
      { label: 'Radiator Dimensions', value: '121 x 394 x 27 mm (360mm)' },
      { label: 'Display Panel', value: '2.36" LCD, 640x640, 60Hz' },
      { label: 'Fans Included', value: '3x F120 RGB Core PWM Fans' },
      { label: 'Socket Support', value: 'LGA1700/1200/115X, AMD AM5/AM4' },
    ],
    tags: ['LCD Screen', '360mm Radiator', 'Asetek 7th Gen Pump', 'CAM Software'],
  },
  {
    id: 'lian-li-o11-dynamic-evo',
    name: 'Lian Li O11 Dynamic EVO RGB Dual-Chamber Mid-Tower Chassis',
    brand: 'Lian Li',
    category: 'Cases',
    price: 159.99,
    previousPrice: 179.99,
    discount: 11,
    rating: 4.9,
    reviewCount: 2980,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=800&q=80',
    slug: 'lian-li-o11-dynamic-evo-rgb',
    isFeatured: true,
    wattage: 0,
    description: 'Dual-chamber design with dual L-shaped light strips that run along the top and bottom panels. Seamless glass viewing panels with zero obstructive corner pillars for full panoramic showcasing.',
    specifications: [
      { label: 'Form Factor', value: 'Dual-Chamber Mid Tower (E-ATX, ATX, Micro-ATX)' },
      { label: 'Radiator Support', value: 'Top: 360mm, Side: 360mm, Bottom: 360mm' },
      { label: 'GPU Clearance', value: 'Up to 455mm length, 167mm width' },
      { label: 'Drive Bays', value: '4x 2.5" SSD or 2x 3.5" HDD' },
    ],
    tags: ['Dual Chamber', 'Panoramic Glass', 'Triple 360 Radiator Support'],
  },
  {
    id: 'seasonic-prime-tx-1300',
    name: 'Seasonic PRIME TX-1300 ATX 3.0 Titanium 1300W Fully Modular',
    brand: 'Seasonic',
    category: 'Power Supplies',
    price: 459.99,
    rating: 5.0,
    reviewCount: 340,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
    slug: 'seasonic-prime-tx-1300-atx3',
    isFeatured: true,
    wattage: 0,
    description: 'The pinnacle of power delivery. 80 PLUS Titanium certified with 94% efficiency at 50% system load. Native 16-pin 12VHPWR PCIe 5.0 cable with Japanese 105°C rated capacitors and 12-year warranty.',
    specifications: [
      { label: 'Wattage & Standard', value: '1300 Watts / ATX 3.0 & PCIe 5.0 Native' },
      { label: 'Efficiency Rating', value: '80 PLUS Titanium Certified' },
      { label: 'Modularity', value: '100% Fully Modular with Braided Cables' },
      { label: 'Cooling & Noise', value: '135mm Fluid Dynamic Bearing with Hybrid Fan Control' },
      { label: 'Warranty', value: '12 Years Manufacturer Warranty' },
    ],
    tags: ['Titanium 80+', 'ATX 3.0', '12VHPWR', '12-Year Warranty'],
  },
  {
    id: 'asus-rog-swift-pg32ucdm',
    name: 'ASUS ROG Swift OLED PG32UCDM 32" 4K 240Hz QD-OLED Gaming Monitor',
    brand: 'ASUS ROG',
    category: 'Monitors',
    price: 1299.99,
    previousPrice: 1399.99,
    discount: 7,
    rating: 4.9,
    reviewCount: 420,
    stockStatus: 'low-stock',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    slug: 'asus-rog-swift-oled-pg32ucdm-4k-240hz',
    isNew: true,
    isFeatured: true,
    wattage: 80,
    description: 'Experience unprecedented visual clarity with the 3rd-generation 32-inch 4K QD-OLED panel featuring a 240Hz refresh rate, 0.03ms response time, custom graphene heatsink, and 99% DCI-P3 color gamut.',
    specifications: [
      { label: 'Panel Type & Size', value: '31.5" Quantum Dot OLED (QD-OLED)' },
      { label: 'Resolution & Aspect', value: '3840 x 2160 (4K UHD) / 16:9' },
      { label: 'Refresh Rate & Response', value: '240 Hz / 0.03 ms (GTG)' },
      { label: 'HDR & Brightness', value: 'DisplayHDR True Black 400 / 1000 nits Peak' },
      { label: 'Connectivity', value: '2x HDMI 2.1, 1x DisplayPort 1.4 (DSC), 1x USB-C (90W PD)' },
    ],
    tags: ['QD-OLED', '4K 240Hz', '0.03ms GTG', 'Custom Graphene Heatsink'],
  },
  {
    id: 'wooting-60he-plus',
    name: 'Wooting 60HE+ Analog Hall Effect Magnetic Gaming Keyboard',
    brand: 'Wooting',
    category: 'Peripherals',
    price: 189.99,
    rating: 5.0,
    reviewCount: 3120,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    slug: 'wooting-60he-plus-hall-effect-keyboard',
    isFeatured: true,
    wattage: 5,
    specifications: [
      { label: 'Switch Type', value: 'Lekker Hall Effect Magnetic Switches' },
      { label: 'Actuation Point', value: 'Customizable 0.1mm to 4.0mm' },
      { label: 'Rapid Trigger', value: 'Instant dynamic key reset capability' },
      { label: 'Polling Rate', value: '1000 Hz with tachyon mode (<1ms input latency)' },
    ],
    tags: ['Rapid Trigger', 'Hall Effect', 'Esports Standard'],
  },
  {
    id: 'msi-rtx-4070-ti-super',
    name: 'MSI GeForce RTX 4070 Ti SUPER 16GB VENTUS 3X OC',
    brand: 'MSI',
    category: 'Graphics Cards',
    price: 799.99,
    previousPrice: 849.99,
    discount: 6,
    rating: 4.7,
    reviewCount: 612,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
    slug: 'msi-rtx-4070-ti-super-ventus-3x',
    wattage: 285,
    specifications: [
      { label: 'VRAM', value: '16GB GDDR6X' },
      { label: 'Boost Clock', value: '2610 MHz' },
      { label: 'Memory Bus', value: '256-bit' },
      { label: 'TDP', value: '285W' },
    ],
    tags: ['1440p Ultra', 'DLSS 3', '16GB VRAM'],
  },
  {
    id: 'amd-ryzen-9-9950x',
    name: 'AMD Ryzen 9 9950X 16-Core Zen 5 Processor',
    brand: 'AMD',
    category: 'CPUs',
    price: 549.99,
    previousPrice: 599.99,
    discount: 8,
    rating: 4.8,
    reviewCount: 421,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&q=80',
    slug: 'amd-ryzen-9-9950x-zen5',
    isNew: true,
    wattage: 170,
    specifications: [
      { label: 'Cores / Threads', value: '16 Cores / 32 Threads' },
      { label: 'Max Boost Clock', value: '5.7 GHz' },
      { label: 'L3 Cache', value: '64 MB' },
      { label: 'Socket', value: 'AM5' },
    ],
    tags: ['Zen 5', 'Content Creation', 'AM5 Platform'],
  },
  {
    id: 'asus-tuf-b650-plus',
    name: 'ASUS TUF Gaming B650-PLUS WIFI AM5 ATX Motherboard',
    brand: 'ASUS',
    category: 'Motherboards',
    price: 189.99,
    previousPrice: 219.99,
    discount: 14,
    rating: 4.7,
    reviewCount: 1104,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    slug: 'asus-tuf-gaming-b650-plus-wifi',
    wattage: 45,
    specifications: [
      { label: 'Socket & Chipset', value: 'AM5 / AMD B650' },
      { label: 'Memory Support', value: '4x DDR5 up to 7200 MHz (OC)' },
      { label: 'Expansion', value: '1x PCIe 5.0 M.2, 1x PCIe 4.0 M.2' },
      { label: 'Networking', value: 'Wi-Fi 6 + 2.5G LAN' },
    ],
    tags: ['AM5', 'DDR5', 'Wi-Fi 6', 'Value Pick'],
  },
  {
    id: 'corsair-vengeance-ddr5-32gb',
    name: 'Corsair VENGEANCE 32GB (2x16GB) DDR5-6000 CL30 EXPO',
    brand: 'Corsair',
    category: 'RAM',
    price: 114.99,
    previousPrice: 139.99,
    discount: 18,
    rating: 4.8,
    reviewCount: 2210,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800&q=80',
    slug: 'corsair-vengeance-ddr5-6000-32gb',
    wattage: 12,
    specifications: [
      { label: 'Capacity', value: '32GB (2x16GB)' },
      { label: 'Speed', value: 'DDR5-6000' },
      { label: 'Latency', value: 'CL30-36-36-76' },
      { label: 'Profile', value: 'AMD EXPO / Intel XMP 3.0' },
    ],
    tags: ['DDR5-6000', 'CL30', 'EXPO', 'Best Value'],
  },
  {
    id: 'wd-black-sn850x-2tb',
    name: 'WD_BLACK SN850X 2TB PCIe Gen4 NVMe M.2 SSD',
    brand: 'Western Digital',
    category: 'Storage',
    price: 149.99,
    previousPrice: 199.99,
    discount: 25,
    rating: 4.9,
    reviewCount: 4820,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=800&q=80',
    slug: 'wd-black-sn850x-2tb',
    isFeatured: true,
    wattage: 8,
    specifications: [
      { label: 'Read Speed', value: '7,300 MB/s' },
      { label: 'Write Speed', value: '6,600 MB/s' },
      { label: 'Capacity', value: '2TB' },
      { label: 'Interface', value: 'PCIe Gen 4.0 x4' },
    ],
    tags: ['PCIe 4.0', 'Gaming SSD', 'DirectStorage'],
  },
  {
    id: 'noctua-nh-d15-g2',
    name: 'Noctua NH-D15 G2 Dual-Tower Premium Air Cooler',
    brand: 'Noctua',
    category: 'Cooling',
    price: 149.99,
    rating: 4.9,
    reviewCount: 890,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    slug: 'noctua-nh-d15-g2',
    isNew: true,
    wattage: 6,
    specifications: [
      { label: 'Type', value: 'Dual-Tower Air Cooler' },
      { label: 'Fans', value: '2x NF-A14x25r G2 PWM' },
      { label: 'Height', value: '168 mm' },
      { label: 'Socket', value: 'LGA1700, AM5, AM4' },
    ],
    tags: ['Silent', 'Air Cooling', 'Premium'],
  },
  {
    id: 'fractal-north-charcoal',
    name: 'Fractal Design North Charcoal Mid-Tower ATX Case',
    brand: 'Fractal Design',
    category: 'Cases',
    price: 139.99,
    rating: 4.8,
    reviewCount: 1560,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=800&q=80',
    slug: 'fractal-design-north-charcoal',
    isFeatured: true,
    wattage: 0,
    specifications: [
      { label: 'Form Factor', value: 'Mid Tower (ATX, mATX, ITX)' },
      { label: 'Front Panel', value: 'Real Walnut Wood Slats' },
      { label: 'GPU Clearance', value: 'Up to 355mm' },
      { label: 'Radiator Support', value: 'Top: 360mm, Front: 360mm' },
    ],
    tags: ['Walnut Wood', 'High Airflow', 'Scandinavian'],
  },
  {
    id: 'corsair-rm1000x-shift',
    name: 'Corsair RM1000x SHIFT 1000W 80+ Gold ATX 3.0 PSU',
    brand: 'Corsair',
    category: 'Power Supplies',
    price: 189.99,
    previousPrice: 209.99,
    discount: 10,
    rating: 4.9,
    reviewCount: 1340,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
    slug: 'corsair-rm1000x-shift-1000w',
    wattage: 0,
    specifications: [
      { label: 'Wattage', value: '1000W' },
      { label: 'Efficiency', value: '80 PLUS Gold' },
      { label: 'Standard', value: 'ATX 3.0 / PCIe 5.0 Native' },
      { label: 'Modularity', value: 'Fully Modular Side Interface' },
    ],
    tags: ['1000W', 'Gold', 'ATX 3.0', '12VHPWR'],
  },
  {
    id: 'lg-ultragear-27gr95qe',
    name: 'LG UltraGear 27GR95QE 27" 1440p 240Hz OLED Gaming Monitor',
    brand: 'LG',
    category: 'Monitors',
    price: 799.99,
    previousPrice: 999.99,
    discount: 20,
    rating: 4.8,
    reviewCount: 720,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    slug: 'lg-ultragear-27gr95qe-oled',
    isFeatured: true,
    wattage: 65,
    specifications: [
      { label: 'Panel', value: '26.5" WOLED' },
      { label: 'Resolution', value: '2560 x 1440 (QHD)' },
      { label: 'Refresh / Response', value: '240 Hz / 0.03 ms GTG' },
      { label: 'HDR', value: 'VESA DisplayHDR True Black 400' },
    ],
    tags: ['OLED', '1440p 240Hz', 'G-Sync Compatible'],
  },
  {
    id: 'logitech-g-pro-x-superlight-2',
    name: 'Logitech G PRO X SUPERLIGHT 2 Wireless Gaming Mouse',
    brand: 'Logitech',
    category: 'Peripherals',
    price: 159.99,
    rating: 4.9,
    reviewCount: 5240,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    slug: 'logitech-g-pro-x-superlight-2',
    isFeatured: true,
    wattage: 3,
    specifications: [
      { label: 'Sensor', value: 'HERO 2 (44,000 DPI)' },
      { label: 'Weight', value: '60 grams' },
      { label: 'Polling Rate', value: '8000 Hz LIGHTSPEED' },
      { label: 'Battery', value: 'Up to 95 hours' },
    ],
    tags: ['Wireless', 'Ultralight', 'Esports'],
  },
  {
    id: 'elgato-4k-x-capture',
    name: 'Elgato 4K X Capture Card (4K144 / 8K30 HDR10)',
    brand: 'Elgato',
    category: 'Streaming',
    price: 199.99,
    rating: 4.7,
    reviewCount: 340,
    stockStatus: 'low-stock',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
    slug: 'elgato-4k-x-capture-card',
    isNew: true,
    wattage: 5,
    specifications: [
      { label: 'Capture', value: '4K144, 4K60 HDR10' },
      { label: 'Passthrough', value: '4K240 / 8K30' },
      { label: 'Interface', value: 'PCIe / USB 3.2 Gen 2' },
      { label: 'Latency', value: 'Ultra-low instant view' },
    ],
    tags: ['4K Capture', 'HDR10', 'Creator'],
  },
]

// ─── Attach deterministic SKU + stock counts ───────────────────────────────────

const STOCK_BY_STATUS: Record<StockStatus, number> = {
  'in-stock': 48,
  'low-stock': 6,
  'out-of-stock': 0,
}

function normalize(list: Product[]): Product[] {
  return list.map((p, i) => ({
    ...p,
    sku: p.sku ?? `PP-${p.category.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${String(1000 + i * 7).slice(0, 4)}`,
    stockCount: p.stockCount ?? STOCK_BY_STATUS[p.stockStatus] + ((i * 3) % 40),
  }))
}

export const allProducts: Product[] = normalize(rawProducts)

// ─── Gaming PCs Prebuilts & Performance Benchmarks ─────────────────────────────

export const gamingPCsData: GamingPC[] = [
  {
    id: 'pc-apex-titan',
    name: 'APEX TITAN ZERO - RTX 5090 / i9-14900KS Ultra Flagship',
    brand: 'PREMIUM PC',
    category: 'Gaming PCs',
    price: 4799.99,
    previousPrice: 5199.99,
    discount: 8,
    rating: 5.0,
    reviewCount: 94,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
    ],
    slug: 'apex-titan-zero-rtx-5090-i9-14900ks',
    isNew: true,
    isFeatured: true,
    wattage: 1000,
    cpu: 'Intel Core i9-14900KS (6.2 GHz)',
    gpu: 'NVIDIA GeForce RTX 5090 32GB GDDR7',
    ram: '64GB DDR5-6400 Corsair Dominator Titanium',
    storage: '4TB Crucial T700 PCIe 5.0 NVMe (12,400 MB/s)',
    caseName: 'Lian Li O11 Dynamic EVO RGB Panoramic',
    powerSupply: 'Seasonic PRIME TX-1300W Titanium ATX 3.0',
    coolingType: 'NZXT Kraken Elite 360 RGB LCD Liquid Cooler',
    performanceTier: 'Tier 4 - Enthusiast Extreme',
    description: 'Engineered without compromise for gamers and computational creators who demand the absolute highest framerates in 4K resolution with full path tracing and machine learning workloads.',
    specifications: [
      { label: 'Processor', value: 'Intel Core i9-14900KS 24-Core 6.2GHz Turbo' },
      { label: 'Graphics Card', value: 'NVIDIA GeForce RTX 5090 32GB GDDR7' },
      { label: 'Motherboard', value: 'ASUS ROG MAXIMUS Z790 DARK HERO' },
      { label: 'Memory', value: '64GB (2x32GB) DDR5-6400 CL30 RGB' },
      { label: 'Primary Storage', value: '4TB Gen5 NVMe SSD (12,400 MB/s Read)' },
      { label: 'Power Supply', value: '1300W 80+ Titanium Fully Modular ATX 3.0' },
      { label: 'Chassis', value: 'Lian Li O11D EVO RGB Glass Showcase' },
      { label: 'Operating System', value: 'Windows 11 Pro 64-bit Pre-Activated' },
      { label: 'Stress Testing', value: '72-Hour Prime95 & 3DMark Burn-In Verified' },
    ],
    fpsBenchmarks: [
      { game: 'Cyberpunk 2077 (Path Tracing Ultra)', fps1440p: 215, fps4K: 145 },
      { game: 'Black Myth: Wukong (Cinematic 4K)', fps1440p: 195, fps4K: 132 },
      { game: 'Call of Duty: Warzone (Competitive)', fps1440p: 340, fps4K: 240 },
      { game: 'Counter-Strike 2 (Max Settings)', fps1440p: 680, fps4K: 520 },
    ],
    tags: ['RTX 5090', 'i9-14900KS', 'PCIe 5.0 SSD', 'Flagship Rig'],
  },
  {
    id: 'pc-hyperion-x3d',
    name: 'HYPERION X3D - AMD Ryzen 7 7800X3D / RTX 4090 OC',
    brand: 'PREMIUM PC',
    category: 'Gaming PCs',
    price: 3499.99,
    previousPrice: 3799.99,
    discount: 8,
    rating: 5.0,
    reviewCount: 168,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1593640408182-31c228be2ece?w=800&q=80',
    slug: 'hyperion-x3d-ryzen-7-7800x3d-rtx-4090',
    isFeatured: true,
    wattage: 850,
    cpu: 'AMD Ryzen 7 7800X3D (8C/16T, 96MB 3D V-Cache)',
    gpu: 'ASUS ROG Strix GeForce RTX 4090 24GB OC',
    ram: '32GB DDR5-6000 CL30 AMD EXPO Low Latency',
    storage: '2TB Samsung 990 PRO NVMe SSD',
    caseName: 'HYTE Y70 Touch Infinite 4K Screen Chassis',
    powerSupply: 'Corsair RM1000x 1000W 80+ Gold ATX 3.0',
    coolingType: 'Corsair iCUE LINK H150i RGB 360mm',
    performanceTier: 'Tier 3 - 4K Ultra',
    description: 'The pure gaming supremacy machine. Pairing the 3D V-Cache architecture of the Ryzen 7 7800X3D with the brute rendering power of the RTX 4090 for uncompromising esports and AAA 4K performance.',
    specifications: [
      { label: 'Processor', value: 'AMD Ryzen 7 7800X3D 8-Core 3D V-Cache' },
      { label: 'Graphics Card', value: 'ASUS ROG Strix GeForce RTX 4090 24GB' },
      { label: 'Motherboard', value: 'MSI MAG X670E TOMAHAWK WIFI' },
      { label: 'Memory', value: '32GB (2x16GB) DDR5-6000 CL30' },
      { label: 'Storage', value: '2TB Samsung 990 PRO PCIe 4.0' },
      { label: 'Power Supply', value: '1000W 80+ Gold Fully Modular' },
    ],
    fpsBenchmarks: [
      { game: 'Cyberpunk 2077 (Ray Tracing Ultra)', fps1440p: 180, fps4K: 110 },
      { game: 'Valorant / CS2 (Esports)', fps1440p: 750, fps4K: 580 },
      { game: 'Forza Horizon 5 (Extreme Settings)', fps1440p: 260, fps4K: 175 },
    ],
    tags: ['7800X3D', 'RTX 4090', 'Esports King'],
  },
  {
    id: 'pc-vector-pro',
    name: 'VECTOR PRO - Intel Core i7-14700K / RTX 4080 Super',
    brand: 'PREMIUM PC',
    category: 'Gaming PCs',
    price: 2499.99,
    previousPrice: 2799.99,
    discount: 11,
    rating: 4.8,
    reviewCount: 215,
    stockStatus: 'in-stock',
    image: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=800&q=80',
    slug: 'vector-pro-i7-14700k-rtx-4080-super',
    isFeatured: true,
    wattage: 750,
    cpu: 'Intel Core i7-14700K 20-Core (5.6 GHz)',
    gpu: 'MSI GeForce RTX 4080 SUPER 16GB SUPRIM X',
    ram: '32GB DDR5-6000 G.Skill Trident Z5 RGB',
    storage: '2TB PCIe 4.0 NVMe SSD',
    caseName: 'Corsair 4000D Airflow High Performance',
    powerSupply: '850W 80+ Gold ATX 3.0 Modular',
    coolingType: 'DeepCool LT720 360mm Liquid Cooler',
    performanceTier: 'Tier 2 - 1440p Pro',
    specifications: [
      { label: 'Processor', value: 'Intel Core i7-14700K 20-Core' },
      { label: 'Graphics Card', value: 'MSI GeForce RTX 4080 SUPER 16GB' },
      { label: 'Memory', value: '32GB DDR5-6000' },
      { label: 'Storage', value: '2TB High Speed NVMe' },
    ],
    fpsBenchmarks: [
      { game: 'Cyberpunk 2077 (Ultra RT)', fps1440p: 140, fps4K: 85 },
      { game: 'Call of Duty: Warzone', fps1440p: 260, fps4K: 165 },
    ],
    tags: ['RTX 4080 Super', 'i7-14700K', '1440p High Refresh'],
  },
]

// ─── Deal Products (Linked directly to active master items) ───────────────────

export const dealProducts: Product[] = allProducts.filter((p) => (p.discount || 0) > 0)

// ─── Featured Products for Homepage ───────────────────────────────────────────

export const featuredProducts: Product[] = allProducts.filter((p) => p.isFeatured)

// ─── Brands ───────────────────────────────────────────────────────────────────

export const featuredBrands: Brand[] = [
  { id: 'nvidia', name: 'NVIDIA', href: '/products?brand=NVIDIA', description: 'GeForce GPUs & AI computing architectures' },
  { id: 'amd', name: 'AMD', href: '/products?brand=AMD', description: 'Ryzen processors & Radeon graphics hardware' },
  { id: 'intel', name: 'Intel', href: '/products?brand=Intel', description: 'Core desktop processors & advanced computing' },
  { id: 'asus-rog', name: 'ASUS ROG', href: '/products?brand=ASUS%20ROG', description: 'Republic of Gamers motherboards, monitors & GPUs' },
  { id: 'msi', name: 'MSI', href: '/products?brand=MSI', description: 'High performance graphics cards & motherboards' },
  { id: 'corsair', name: 'Corsair', href: '/products?brand=Corsair', description: 'Enthusiast memory, power supplies & cooling' },
  { id: 'nzxt', name: 'NZXT', href: '/products?brand=NZXT', description: 'Modern PC cases, LCD coolers & prebuilt systems' },
  { id: 'samsung', name: 'Samsung', href: '/products?brand=Samsung', description: 'Industry leading 990 PRO NVMe storage solutions' },
]

// ─── Helper Query Functions ───────────────────────────────────────────────────

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id) || gamingPCsData.find((p) => p.id === id)
}

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug) || gamingPCsData.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'All' || !category) return allProducts
  return allProducts.filter(
    (p) => p.category.toLowerCase().replace(/[^a-z0-9]/g, '') === category.toLowerCase().replace(/[^a-z0-9]/g, '')
  )
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim()
  if (!q) return allProducts
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
  )
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(allProducts.filter((p) => p.id !== product.id && p.brand === product.brand))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i && p.category !== 'Gaming PCs')
    .slice(0, limit)
}

export const allBrandNames: string[] = Array.from(new Set(allProducts.map((p) => p.brand))).sort()

// ─── Category Landing Detail Data ──────────────────────────────────────────────

export const categoryDetails: CategoryNode[] = [
  {
    id: 'graphics-cards', name: 'Graphics Cards', slug: 'graphics-cards', href: '/graphics-cards',
    description: 'From NVIDIA Blackwell RTX 50-Series to AMD Radeon RX 7000, our graphics cards deliver uncompromising ray tracing, DLSS 4, and 4K performance for gamers and creators.',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&q=80',
    productCount: 247, visible: true,
    subcategories: ['NVIDIA GeForce RTX 50', 'RTX 40 Super', 'AMD Radeon RX 7000', 'Workstation GPUs', 'Founders Edition'],
    popularBrands: ['NVIDIA', 'ASUS ROG', 'MSI', 'AMD', 'Gigabyte'],
  },
  {
    id: 'cpus', name: 'Processors', slug: 'cpus', href: '/cpus',
    description: 'Intel Core Ultra & 14th Gen alongside AMD Ryzen 9000 Zen 5 and 3D V-Cache gaming chips. Every CPU is genuine retail with full manufacturer warranty.',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=1200&q=80',
    productCount: 183, visible: true,
    subcategories: ['Intel Core Ultra', 'Intel 14th Gen', 'AMD Ryzen 9000', 'Ryzen X3D Gaming', 'Threadripper'],
    popularBrands: ['Intel', 'AMD'],
  },
  {
    id: 'motherboards', name: 'Motherboards', slug: 'motherboards', href: '/motherboards',
    description: 'Z790, X670E, B650 and the latest AM5 & LGA1851 boards with Wi-Fi 7, PCIe 5.0, and DDR5-8000+ overclocking headroom.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
    productCount: 312, visible: true,
    subcategories: ['Intel Z790 / Z890', 'AMD X670E / X870E', 'B650 / B760', 'Mini-ITX', 'Overclocking'],
    popularBrands: ['ASUS ROG', 'MSI', 'ASUS', 'Gigabyte'],
  },
  {
    id: 'ram', name: 'Memory (RAM)', slug: 'ram', href: '/ram',
    description: 'High-speed DDR5 kits from DDR5-6000 CL30 sweet-spot to DDR5-8000+ extreme, with Intel XMP 3.0 and AMD EXPO one-click profiles.',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=1200&q=80',
    productCount: 164, visible: true,
    subcategories: ['DDR5-6000 CL30', 'DDR5-7200+', '32GB Kits', '64GB+ Kits', 'RGB Memory'],
    popularBrands: ['Corsair', 'G.SKILL'],
  },
  {
    id: 'storage', name: 'Storage (SSDs)', slug: 'storage', href: '/storage',
    description: 'PCIe Gen 5 NVMe drives hitting 14,000 MB/s, Gen 4 workhorses, and high-capacity 4TB drives with DirectStorage support.',
    image: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=1200&q=80',
    productCount: 421, visible: true,
    subcategories: ['PCIe Gen 5 NVMe', 'PCIe Gen 4 NVMe', 'Heatsink SSDs', '4TB High Capacity', 'PS5 Compatible'],
    popularBrands: ['Samsung', 'Crucial', 'Western Digital'],
  },
  {
    id: 'monitors', name: 'Monitors', slug: 'monitors', href: '/monitors',
    description: 'QD-OLED and WOLED gaming displays, 4K 240Hz flagships, and 540Hz esports panels engineered for zero-compromise visual clarity.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&q=80',
    productCount: 198, visible: true,
    subcategories: ['QD-OLED', '4K 240Hz', '1440p Esports', 'Ultrawide', 'HDR Displays'],
    popularBrands: ['ASUS ROG', 'LG'],
  },
  {
    id: 'cooling', name: 'Cooling', slug: 'cooling', href: '/cooling',
    description: 'LCD-screen AIO liquid coolers, dual-tower silent air towers, and high static pressure fans to keep flagship silicon frosty.',
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1200&q=80',
    productCount: 156, visible: true,
    subcategories: ['360mm AIO', 'LCD Coolers', 'Air Coolers', 'Case Fans', 'Thermal Paste'],
    popularBrands: ['NZXT', 'Noctua', 'Corsair'],
  },
  {
    id: 'cases', name: 'Cases & Chassis', slug: 'cases', href: '/cases',
    description: 'Panoramic dual-chamber showcases, high-airflow mesh mid-towers, and compact ITX travel cases built for airflow and cable management.',
    image: 'https://images.unsplash.com/photo-1587831991697-cbe1a08b6c2c?w=1200&q=80',
    productCount: 98, visible: true,
    subcategories: ['Dual-Chamber', 'High Airflow Mesh', 'Full Tower', 'Mini-ITX', 'Panoramic Glass'],
    popularBrands: ['Lian Li', 'Fractal Design', 'NZXT'],
  },
  {
    id: 'power-supplies', name: 'Power Supplies', slug: 'power-supplies', href: '/power-supplies',
    description: 'ATX 3.0 Titanium and Gold PSUs with native 12VHPWR connectors, Japanese capacitors, and up to 12-year warranties.',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=1200&q=80',
    productCount: 115, visible: true,
    subcategories: ['1300W+ Titanium', '1000W Platinum', '850W Gold', 'SFX', 'ATX 3.0'],
    popularBrands: ['Seasonic', 'Corsair'],
  },
  {
    id: 'peripherals', name: 'Peripherals', slug: 'peripherals', href: '/peripherals',
    description: 'Hall-effect rapid-trigger keyboards, 8000Hz ultralight wireless mice, and audiophile headsets tuned for competitive advantage.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&q=80',
    productCount: 350, visible: true,
    subcategories: ['Keyboards', 'Gaming Mice', 'Headsets', 'Mousepads', 'Controllers'],
    popularBrands: ['Logitech', 'Wooting'],
  },
]

export function getCategoryDetail(slug: string): CategoryNode | undefined {
  return categoryDetails.find((c) => c.slug === slug)
}

// ─── Sample Orders (customer history + admin) ──────────────────────────────────

function itemOf(id: string, quantity: number) {
  const product = allProducts.find((p) => p.id === id) || gamingPCsData.find((p) => p.id === id)!
  return { product, quantity }
}

export const sampleOrders: Order[] = [
  {
    id: 'ORD-892410', date: 'August 11, 2026', status: 'Shipped',
    trackingNumber: 'TRK-PC-49201948', estimatedDelivery: 'August 16, 2026',
    items: [itemOf('rtx-4090-asus-rog', 1), itemOf('corsair-dominator-titanium', 1)],
    subtotal: 2089.98, shipping: 0, tax: 167.20, total: 2257.18,
    shippingAddress: { name: 'Alexandre Vance', street: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zip: '97477', country: 'United States' },
    customerName: 'Alexandre Vance', customerEmail: 'alex.vance@blackmesa.org',
    paymentMethod: 'Visa •••• 4242', paymentStatus: 'Paid',
    timeline: [
      { status: 'Processing', date: 'Aug 11, 09:14', completed: true, description: 'Order received and payment authorized' },
      { status: 'Assembling', date: 'Aug 11, 15:40', completed: true, description: 'Components allocated from warehouse' },
      { status: 'Quality Check', date: 'Aug 12, 11:02', completed: true, description: '72-hour burn-in verification passed' },
      { status: 'Shipped', date: 'Aug 13, 08:30', completed: true, description: 'Handed to courier — in transit' },
      { status: 'Delivered', date: 'Est. Aug 16', completed: false, description: 'Out for final delivery' },
    ],
  },
  {
    id: 'ORD-771239', date: 'July 19, 2026', status: 'Delivered',
    trackingNumber: 'TRK-PC-91028374', estimatedDelivery: 'July 23, 2026',
    items: [itemOf('intel-i9-14900ks', 1), itemOf('seasonic-prime-tx-1300', 1)],
    subtotal: 1109.98, shipping: 0, tax: 88.80, total: 1198.78,
    shippingAddress: { name: 'Alexandre Vance', street: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zip: '97477', country: 'United States' },
    customerName: 'Alexandre Vance', customerEmail: 'alex.vance@blackmesa.org',
    paymentMethod: 'Visa •••• 4242', paymentStatus: 'Paid',
    timeline: [
      { status: 'Processing', date: 'Jul 19', completed: true, description: 'Order received' },
      { status: 'Assembling', date: 'Jul 19', completed: true, description: 'Components allocated' },
      { status: 'Quality Check', date: 'Jul 20', completed: true, description: 'QC passed' },
      { status: 'Shipped', date: 'Jul 21', completed: true, description: 'Dispatched' },
      { status: 'Delivered', date: 'Jul 23', completed: true, description: 'Delivered and signed for' },
    ],
  },
  {
    id: 'ORD-655017', date: 'June 30, 2026', status: 'Delivered',
    trackingNumber: 'TRK-PC-55017283', estimatedDelivery: 'July 4, 2026',
    items: [itemOf('amd-ryzen-7-7800x3d', 1), itemOf('wd-black-sn850x-2tb', 2)],
    subtotal: 699.97, shipping: 0, tax: 56.00, total: 755.97,
    shippingAddress: { name: 'Alexandre Vance', street: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zip: '97477', country: 'United States' },
    customerName: 'Alexandre Vance', customerEmail: 'alex.vance@blackmesa.org',
    paymentMethod: 'PayPal', paymentStatus: 'Paid',
    timeline: [
      { status: 'Processing', date: 'Jun 30', completed: true, description: 'Order received' },
      { status: 'Assembling', date: 'Jun 30', completed: true, description: 'Components allocated' },
      { status: 'Quality Check', date: 'Jul 1', completed: true, description: 'QC passed' },
      { status: 'Shipped', date: 'Jul 2', completed: true, description: 'Dispatched' },
      { status: 'Delivered', date: 'Jul 4', completed: true, description: 'Delivered' },
    ],
  },
]

export function getOrderById(id: string): Order | undefined {
  return sampleOrders.find((o) => o.id === id)
}

// ─── Admin: Orders queue (broader set) ─────────────────────────────────────────

export const adminOrders = [
  { id: 'ORD-892410', customer: 'Alexandre Vance', email: 'alex.vance@blackmesa.org', items: 2, amount: 2257.18, payment: 'Paid', shipping: 'Shipped', status: 'Shipped', date: 'Aug 11, 2026' },
  { id: 'ORD-892388', customer: 'Marcus Holloway', email: 'm.holloway@dedsec.io', items: 1, amount: 4799.99, payment: 'Paid', shipping: 'Processing', status: 'Processing', date: 'Aug 11, 2026' },
  { id: 'ORD-892355', customer: 'Sarah Chen', email: 'schen@nexus.dev', items: 4, amount: 1289.96, payment: 'Pending', shipping: 'Awaiting', status: 'Processing', date: 'Aug 10, 2026' },
  { id: 'ORD-892301', customer: 'David Okafor', email: 'dokafor@vertex.com', items: 1, amount: 999.99, payment: 'Paid', shipping: 'Shipped', status: 'Shipped', date: 'Aug 10, 2026' },
  { id: 'ORD-892287', customer: 'Elena Rodriguez', email: 'elena.r@pixel.studio', items: 3, amount: 3499.99, payment: 'Paid', shipping: 'Delivered', status: 'Delivered', date: 'Aug 9, 2026' },
  { id: 'ORD-892240', customer: 'James Park', email: 'jpark@quanta.net', items: 2, amount: 549.98, payment: 'Refunded', shipping: 'Returned', status: 'Cancelled', date: 'Aug 9, 2026' },
  { id: 'ORD-892198', customer: 'Aisha Kone', email: 'akone@meridian.co', items: 1, amount: 1799.99, payment: 'Paid', shipping: 'Delivered', status: 'Delivered', date: 'Aug 8, 2026' },
  { id: 'ORD-892150', customer: 'Tom Wagner', email: 'twagner@forge.io', items: 5, amount: 892.45, payment: 'Paid', shipping: 'Shipped', status: 'Shipped', date: 'Aug 8, 2026' },
]

// ─── Admin: Customers ──────────────────────────────────────────────────────────

export const adminCustomers: Customer[] = [
  { id: 'CUST-1001', name: 'Alexandre Vance', email: 'alex.vance@blackmesa.org', avatarColor: '#007aff', orders: 14, totalSpent: 18420.55, registered: 'Jan 2024', status: 'VIP', location: 'Springfield, OR' },
  { id: 'CUST-1002', name: 'Marcus Holloway', email: 'm.holloway@dedsec.io', avatarColor: '#ff5c00', orders: 3, totalSpent: 9240.12, registered: 'Mar 2025', status: 'Active', location: 'San Francisco, CA' },
  { id: 'CUST-1003', name: 'Sarah Chen', email: 'schen@nexus.dev', avatarColor: '#30d158', orders: 8, totalSpent: 6120.40, registered: 'Nov 2024', status: 'Active', location: 'Seattle, WA' },
  { id: 'CUST-1004', name: 'David Okafor', email: 'dokafor@vertex.com', avatarColor: '#ffd60a', orders: 2, totalSpent: 1999.98, registered: 'Jun 2026', status: 'Active', location: 'Austin, TX' },
  { id: 'CUST-1005', name: 'Elena Rodriguez', email: 'elena.r@pixel.studio', avatarColor: '#bf5af2', orders: 21, totalSpent: 32890.00, registered: 'Aug 2023', status: 'VIP', location: 'Miami, FL' },
  { id: 'CUST-1006', name: 'James Park', email: 'jpark@quanta.net', avatarColor: '#ff453a', orders: 1, totalSpent: 549.98, registered: 'Aug 2026', status: 'Inactive', location: 'Denver, CO' },
  { id: 'CUST-1007', name: 'Aisha Kone', email: 'akone@meridian.co', avatarColor: '#5ac8fa', orders: 6, totalSpent: 8750.33, registered: 'Feb 2025', status: 'Active', location: 'Chicago, IL' },
  { id: 'CUST-1008', name: 'Tom Wagner', email: 'twagner@forge.io', avatarColor: '#64d2ff', orders: 4, totalSpent: 3210.80, registered: 'Dec 2025', status: 'Active', location: 'Portland, OR' },
]

// ─── Admin: Coupons / Promotions ───────────────────────────────────────────────

export const coupons: Coupon[] = [
  { id: 'CPN-01', code: 'HARDWARE10', description: '10% off all components', type: 'percent', value: 10, status: 'Active', uses: 1240, maxUses: 5000, expires: 'Dec 31, 2026' },
  { id: 'CPN-02', code: 'APEX10', description: '10% off gaming PCs & builds', type: 'percent', value: 10, status: 'Active', uses: 412, maxUses: 1000, expires: 'Sep 30, 2026' },
  { id: 'CPN-03', code: 'RTX50LAUNCH', description: '$150 off RTX 50-series GPUs', type: 'fixed', value: 150, status: 'Active', uses: 89, maxUses: 500, expires: 'Aug 31, 2026' },
  { id: 'CPN-04', code: 'FREESHIP', description: 'Free express shipping', type: 'fixed', value: 15, status: 'Active', uses: 3021, maxUses: 99999, expires: 'Dec 31, 2026' },
  { id: 'CPN-05', code: 'BLACKFRI25', description: '25% off sitewide — Black Friday', type: 'percent', value: 25, status: 'Scheduled', uses: 0, maxUses: 10000, expires: 'Nov 30, 2026' },
  { id: 'CPN-06', code: 'SUMMER20', description: '20% off peripherals', type: 'percent', value: 20, status: 'Expired', uses: 2450, maxUses: 2500, expires: 'Jul 31, 2026' },
]

// ─── Admin: Inventory ──────────────────────────────────────────────────────────

const SUPPLIERS = ['TechDist Global', 'NordVenture Supply', 'Pacific Components', 'Vertex Wholesale', 'MicroChannel Ltd']

export const inventoryRows: InventoryRow[] = allProducts.map((product, i) => ({
  product,
  reserved: Math.max(0, ((i * 5) % 12)),
  supplier: SUPPLIERS[i % SUPPLIERS.length],
  restockEta: product.stockStatus === 'out-of-stock' ? 'Aug 22, 2026' : product.stockStatus === 'low-stock' ? 'Aug 18, 2026' : '—',
}))

// ─── Admin: Analytics time-series ──────────────────────────────────────────────

export const revenueSeries = [
  { label: 'Feb', value: 284000 }, { label: 'Mar', value: 312000 }, { label: 'Apr', value: 298000 },
  { label: 'May', value: 356000 }, { label: 'Jun', value: 389000 }, { label: 'Jul', value: 421000 },
  { label: 'Aug', value: 468000 },
]

export const ordersSeries = [
  { label: 'Feb', value: 1240 }, { label: 'Mar', value: 1380 }, { label: 'Apr', value: 1290 },
  { label: 'May', value: 1520 }, { label: 'Jun', value: 1690 }, { label: 'Jul', value: 1820 },
  { label: 'Aug', value: 2010 },
]

export const categoryRevenue = [
  { label: 'Graphics Cards', value: 42 }, { label: 'Gaming PCs', value: 24 }, { label: 'CPUs', value: 14 },
  { label: 'Monitors', value: 9 }, { label: 'Storage', value: 6 }, { label: 'Other', value: 5 },
]
