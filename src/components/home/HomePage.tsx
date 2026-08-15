import { Link } from 'react-router-dom'
import { SectionHeader, Icon } from '../ui'
import { ProductGrid } from '../products/ProductCard'
import { HeroSection } from './HeroSection'
import { CategorySection } from './CategorySection'
import { DealsSection } from './DealsSection'
import { GamingPCSection } from './GamingPCSection'
import { BrandSection } from './BrandSection'
import { Newsletter } from './Newsletter'
import { PromotionalCard } from './HeroSection'
import {
  featuredProducts,
  featuredCategories,
  dealProducts,
  gamingPCsData,
  featuredBrands,
  allProducts,
} from '../../data'
import { useShop } from '../../context/ShopContext'

// ─── Gaming PCs Promo Banner ───────────────────────────────────────────────────

function CustomBuildsBanner() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PromotionalCard
        title="HYPERION CUSTOMS"
        subtitle="Unrestrained 4K gaming rigs built in dual-chamber panoramic glass showcases"
        badge="FLAGSHIP"
        ctaLabel="EXPLORE PREBUILTS"
        ctaHref="/gaming-pcs"
        image="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80"
        accentColor="#ff5c00"
      />
      <PromotionalCard
        title="CUSTOM PC BUILDER"
        subtitle="Pick your CPU, GPU, RAM, & Cooling. Live wattage and compatibility checking."
        badge="CONFIGURATOR"
        ctaLabel="START CUSTOM BUILD"
        ctaHref="/builder"
        image="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80"
        accentColor="#007aff"
      />
      <PromotionalCard
        title="AI & 3D WORKSTATIONS"
        subtitle="Multi-GPU systems configured for Blender, Unreal Engine 5, & LLM inference."
        badge="ENTERPRISE"
        ctaLabel="WORKSTATION LINEUP"
        ctaHref="/products?category=Workstations"
        image="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"
        accentColor="#30d158"
      />
    </section>
  )
}

// ─── Feature Bar ───────────────────────────────────────────────────────────────

function FeatureBar() {
  const features = [
    { icon: 'local_shipping', label: 'EXPRESS DISPATCH', sublabel: 'Same-day on in-stock items' },
    { icon: 'shield', label: 'PRICE PROTECTION', sublabel: '30-day price match policy' },
    { icon: 'verified', label: 'OFFICIAL RETAILER', sublabel: '100% genuine factory warranty' },
    { icon: 'support_agent', label: 'EXPERT PC SUPPORT', sublabel: 'Live system diagnostics' },
    { icon: 'autorenew', label: 'HASSLE-FREE RMA', sublabel: '30-day money-back guarantee' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {features.map((f) => (
        <div key={f.label} className="flex items-center gap-3 p-3.5 bg-[#1a1b1f] border border-[#414755] rounded">
          <Icon name={f.icon} size={22} className="text-[#007aff] shrink-0" />
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-bold tracking-[0.06em] text-[#e3e2e7] truncate">{f.label}</div>
            <div className="text-[#8b90a0] text-[11px] mt-0.5 truncate">{f.sublabel}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Quick Spec Compare Promo ─────────────────────────────────────────────────

function HardwareTicker() {
  return (
    <div className="bg-[#16171d] border border-[#292a2e] rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#30d158] inline-block" />
        <span className="text-[#c1c6d7] font-semibold">LIVE STOCK UPDATE:</span>
        <span className="text-[#8b90a0]">RTX 5090 FE & Ryzen 7 7800X3D units in stock for immediate dispatch.</span>
      </div>
      <Link to="/builder" className="text-[#007aff] hover:underline flex items-center gap-1 font-bold">
        Launch Configurator <Icon name="chevron_right" size={14} />
      </Link>
    </div>
  )
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const { addToCart, toggleWishlist, wishlist } = useShop()

  const gpuProducts = allProducts.filter((p) => p.category === 'Graphics Cards')
  const cpuProducts = allProducts.filter((p) => p.category === 'CPUs')
  const monitorProducts = allProducts.filter((p) => p.category === 'Monitors')

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6 flex flex-col gap-10">

        {/* ① Hero Section */}
        <HeroSection />

        {/* ② Live Stock Ticker */}
        <HardwareTicker />

        {/* ③ Feature Bar */}
        <FeatureBar />

        {/* ④ Featured Categories */}
        <CategorySection categories={featuredCategories} />

        {/* ⑤ Deals Section */}
        <DealsSection
          products={dealProducts}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
          wishlistedIds={wishlist}
        />

        {/* ⑥ Dedicated Gaming PC Showcase */}
        <GamingPCSection pcs={gamingPCsData} />

        {/* ⑦ Featured Flagship Hardware */}
        <section>
          <SectionHeader
            title="Featured Hardware & Components"
            subtitle="Enthusiast-grade graphics cards, processors, and PCIe 5.0 SSDs"
            ctaLabel="VIEW ALL PRODUCTS"
            ctaHref="/products"
          />
          <ProductGrid
            products={featuredProducts.slice(0, 4)}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlistedIds={wishlist}
            columns={4}
          />
        </section>

        {/* ⑧ Custom Builds Banner */}
        <CustomBuildsBanner />

        {/* ⑨ Graphics Cards Showcase */}
        <section>
          <SectionHeader
            title="Graphics Cards (GPUs)"
            subtitle="NVIDIA Blackwell RTX 50-Series, RTX 40-Series & AMD Radeon 7000 Series"
            ctaLabel="EXPLORE ALL GPUs"
            ctaHref="/graphics-cards"
          />
          <ProductGrid
            products={gpuProducts}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlistedIds={wishlist}
            columns={4}
          />
        </section>

        {/* ⑩ Desktop Processors */}
        <section>
          <SectionHeader
            title="Desktop Processors (CPUs)"
            subtitle="Intel 14th Gen Core i9 & AMD Ryzen 7000 3D V-Cache"
            ctaLabel="ALL PROCESSORS"
            ctaHref="/cpus"
          />
          <ProductGrid
            products={cpuProducts}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlistedIds={wishlist}
            columns={4}
          />
        </section>

        {/* ⑪ Esports & HDR Monitors */}
        <section>
          <SectionHeader
            title="High-Refresh & QD-OLED Monitors"
            subtitle="From 540Hz esports precision to 4K 240Hz QD-OLED true black visual displays"
            ctaLabel="ALL MONITORS"
            ctaHref="/monitors"
          />
          <ProductGrid
            products={monitorProducts}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlistedIds={wishlist}
            columns={4}
          />
        </section>

        {/* ⑫ Authorized Brand Partners */}
        <BrandSection brands={featuredBrands} />

        {/* ⑬ Newsletter */}
        <Newsletter />
      </div>
    </main>
  )
}
