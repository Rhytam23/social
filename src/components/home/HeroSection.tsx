import { Link } from 'react-router-dom'
import { Icon } from '../ui'

// ─── HeroSection (Cinematic Hardware Hero) ───────────────────────────────────

export function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 min-h-[560px] lg:min-h-[620px] max-w-[1400px] mx-auto w-full">
      {/* Primary Hero Campaign (58-60% width desktop - 7 cols) */}
      <div className="lg:col-span-7 relative rounded-lg overflow-hidden border border-[#292a2e] hover:border-[#007aff50] bg-[#16171d] flex flex-col justify-end min-h-[440px] lg:min-h-full group shadow-2xl transition-all duration-300">
        {/* Background Product Image */}
        <div
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=1600&q=85')`,
          }}
        />

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/85 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/40 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-[#007aff08] mix-blend-overlay z-[1]" />

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-[560px]">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#007aff20] border border-[#007aff60] text-[#007aff] font-mono text-[10px] tracking-wider rounded font-bold uppercase mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] animate-pulse" />
            NEW ARRIVAL
          </span>

          {/* Headline */}
          <h1 className="text-white font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-4">
            NVIDIA RTX 5090 <br className="hidden sm:inline" />
            <span className="text-[#007aff]">FOUNDERS EDITION</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-[#c1c6d7] text-sm sm:text-base leading-relaxed mb-8 max-w-[450px]">
            Uncompromising performance for next-generation 4K gaming and computational creation.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/gaming-pcs"
              className="px-6 py-3.5 bg-[#007aff] hover:bg-[#0066d6] active:bg-[#004fc2] text-white font-mono text-xs sm:text-sm tracking-wider font-bold rounded-md flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-[#007aff40] hover:-translate-y-0.5"
            >
              <span>SHOP GAMING PCS</span>
              <Icon name="arrow_forward" size={16} />
            </Link>
            <Link
              to="/builder"
              className="px-6 py-3.5 bg-[#18191e]/90 hover:bg-[#22242c] border border-[#414755] hover:border-[#007aff] text-white font-mono text-xs sm:text-sm tracking-wider font-bold rounded-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <span>BUILD YOUR PC</span>
              <Icon name="memory" size={16} className="text-[#007aff]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Supporting Promotions (40-42% width desktop - 5 cols stacked) */}
      <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5">
        {/* CARD 1: Intel Core i9-14900KS */}
        <div className="relative flex-1 rounded-lg overflow-hidden border border-[#292a2e] hover:border-[#007aff50] bg-[#16171d] flex flex-col justify-end p-6 group min-h-[260px] lg:min-h-0 shadow-xl transition-all duration-300">
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/80 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-transparent to-transparent z-[1]" />

          <div className="relative z-10 max-w-[360px]">
            <span className="inline-block px-2.5 py-0.5 bg-[#ff5c0015] border border-[#ff5c0040] text-[#ff5c00] font-mono text-[9px] tracking-wider rounded font-bold uppercase mb-2">
              FLAGSHIP CPU
            </span>
            <h2 className="text-white font-bold text-xl sm:text-2xl leading-tight tracking-tight mb-1.5">
              INTEL CORE i9-14900KS
            </h2>
            <p className="text-[#8b90a0] text-xs leading-relaxed mb-4">
              Extreme clock speeds for uncompromising performance.
            </p>
            <Link
              to="/cpus"
              className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider text-[#007aff] hover:text-[#adc6ff] transition-colors font-bold group-hover:translate-x-1"
            >
              <span>SHOP PROCESSORS</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
          </div>
        </div>

        {/* CARD 2: Apex Workstations */}
        <div className="relative flex-1 rounded-lg overflow-hidden border border-[#292a2e] hover:border-[#007aff50] bg-[#16171d] flex flex-col justify-end p-6 group min-h-[260px] lg:min-h-0 shadow-xl transition-all duration-300">
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/80 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-transparent to-transparent z-[1]" />

          <div className="relative z-10 max-w-[360px]">
            <span className="inline-block px-2.5 py-0.5 bg-[#30d15815] border border-[#30d15830] text-[#30d158] font-mono text-[9px] tracking-wider rounded font-bold uppercase mb-2">
              ENTERPRISE
            </span>
            <h2 className="text-white font-bold text-xl sm:text-2xl leading-tight tracking-tight mb-1.5">
              APEX WORKSTATIONS
            </h2>
            <p className="text-[#8b90a0] text-xs leading-relaxed mb-4">
              Professional systems engineered for demanding workloads.
            </p>
            <Link
              to="/products?category=Workstations"
              className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider text-[#007aff] hover:text-[#adc6ff] transition-colors font-bold group-hover:translate-x-1"
            >
              <span>EXPLORE BUILDS</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PromotionalCard (Reusable Secondary Banner) ──────────────────────────────

interface PromotionalCardProps {
  title: string
  subtitle: string
  badge?: string
  ctaLabel: string
  ctaHref: string
  image: string
  accentColor?: string
}

export function PromotionalCard({
  title,
  subtitle,
  badge,
  ctaLabel,
  ctaHref,
  image,
  accentColor = '#007aff',
}: PromotionalCardProps) {
  return (
    <div
      className="relative rounded-lg overflow-hidden border border-[#292a2e] hover:border-[#007aff50] bg-[#16171d] flex flex-col justify-end group min-h-[260px] sm:min-h-[280px] p-6 shadow-xl transition-all duration-300"
    >
      <div
        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/80 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-transparent to-transparent z-[1]" />

      <div className="relative z-10">
        {badge && (
          <span
            className="inline-block mb-2 px-2.5 py-0.5 font-mono text-[10px] tracking-wider rounded text-white font-bold uppercase"
            style={{ backgroundColor: accentColor }}
          >
            {badge}
          </span>
        )}
        <h3 className="text-white font-bold text-lg sm:text-xl leading-snug mb-1">{title}</h3>
        <p className="text-[#8b90a0] text-xs mb-4 line-clamp-2">{subtitle}</p>
        <Link
          to={ctaHref}
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider text-white hover:text-[#adc6ff] transition-colors font-bold group-hover:translate-x-1"
        >
          <span>{ctaLabel}</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>
    </div>
  )
}
