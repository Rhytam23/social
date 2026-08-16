import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui'
import { useShop } from '../../context/ShopContext'

// ─── HeroSection (Cinematic Flagship Hardware Hero) ─────────────────────────

export function HeroSection() {
  const { heroCampaign } = useShop()
  const [gpuImgError, setGpuImgError] = useState(false)
  const [intelImgError, setIntelImgError] = useState(false)
  const [apexImgError, setApexImgError] = useState(false)

  return (
    <section className="w-full max-w-container mx-auto">
      {/* ─── MAIN HARDWARE HERO SHOWCASE ─── */}
      <div className="cinematic-hero-card relative w-full rounded-2xl bg-[#121317] border border-[#292a2e] overflow-hidden min-h-135 md:min-h-145 flex flex-col justify-between p-6 sm:p-10 lg:p-14 shadow-xl">
        {/* Background Gradients & Contrast Overlay */}
        <div className="hero-bg-gradient absolute inset-0 bg-linear-to-r from-[#121317] via-[#121317]/90 to-transparent z-1 pointer-events-none hidden lg:block" />
        <div className="hero-bg-gradient-mobile absolute inset-0 bg-linear-to-t from-[#121317] via-[#121317]/80 to-transparent z-1 pointer-events-none lg:hidden" />

        {/* Desktop 45/55 Layout Container */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center h-full my-auto">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center order-1 lg:order-1">
            {/* Label Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-md text-accent-blue font-mono text-xs font-semibold uppercase tracking-wider w-fit mb-4">
              {heroCampaign.badge}
            </div>

            {/* Headline */}
            <h1 className="font-sans font-black tracking-tight leading-[1.02] text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4">
              <span className="hero-headline-primary text-white block">{heroCampaign.headlinePrimary}</span>
              <span className="text-accent-blue block mt-1">{heroCampaign.headlineAccent}</span>
            </h1>

            {/* GPU Visual - Mobile Only */}
            <div className="block lg:hidden my-4 relative w-full aspect-16/10 max-h-60 mx-auto order-2">
              {!gpuImgError ? (
                <img
                  src={heroCampaign.image}
                  alt={heroCampaign.headlinePrimary}
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={() => setGpuImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#16171d] rounded-lg">
                  <Icon name="videogame_asset" size={48} className="text-accent-blue" />
                  <span className="font-mono text-xs text-outline mt-2">RTX 5090 FE</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="hero-subtext text-[#8b90a0] text-sm sm:text-base max-w-lg leading-relaxed mb-6 order-3 font-normal font-sans">
              {heroCampaign.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-4 font-sans">
              <Link
                to={heroCampaign.primaryCtaHref}
                className="h-11 md:h-12 px-6 md:px-7 bg-accent-blue hover:bg-[#0066d6] active:scale-[0.99] text-white text-xs md:text-sm font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>{heroCampaign.primaryCtaLabel}</span>
                <Icon name="arrow_forward" size={16} />
              </Link>

              <Link
                to={heroCampaign.secondaryCtaHref}
                className="hero-sec-btn h-11 md:h-12 px-6 md:px-7 bg-[#1a1b1f] hover:bg-[#23242a] text-white border border-[#292a2e] text-xs md:text-sm font-semibold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <span>{heroCampaign.secondaryCtaLabel}</span>
                <Icon name="memory" size={16} className="text-accent-blue" />
              </Link>
            </div>
          </div>

          {/* Right Column: Hardware Visual (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative items-center justify-center order-2 h-full">
            <div className="relative w-full max-w-160 aspect-16/10 flex items-center justify-center">
              {!gpuImgError ? (
                <img
                  src={heroCampaign.image}
                  alt={heroCampaign.headlinePrimary}
                  className="w-full h-full object-contain drop-shadow-xl hover:scale-[1.01] transition-transform duration-500 select-none z-10"
                  onError={() => setGpuImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#16171d] rounded-xl p-8 z-10 border border-[#292a2e]">
                  <Icon name="videogame_asset" size={80} className="text-accent-blue" />
                  <span className="font-mono text-sm text-outline mt-3">{heroCampaign.headlinePrimary}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SUPPORTING PROMOTIONS STRIP (BELOW MAIN HERO) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mt-4 md:mt-6">
        {/* Strip Card 1: Intel i9-14900KS */}
        <div className="group relative rounded-2xl bg-[#16171d] p-5 md:p-6 flex items-center justify-between gap-4 transition-all duration-300 shadow-lg hover:shadow-xl">
          <div className="flex-1 min-w-0 z-10">
            <span className="inline-block font-mono text-[9px] text-accent-orange bg-accent-orange/10 px-2.5 py-0.5 rounded font-bold uppercase mb-2">
              FLAGSHIP PROCESSOR
            </span>
            <h3 className="text-white font-bold text-base md:text-lg tracking-tight truncate group-hover:text-accent-blue transition-colors">
              INTEL CORE i9-14900KS
            </h3>
            <p className="text-outline text-xs leading-relaxed mt-1 mb-3 line-clamp-1">
              6.2 GHz Max Turbo. Push beyond limits.
            </p>
            <Link
              to="/cpus"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-blue font-bold tracking-wider hover:text-[#adc6ff] transition-colors"
            >
              <span>SHOP PROCESSORS</span>
              <Icon name="arrow_forward" size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#121317] shrink-0 overflow-hidden relative">
            {!intelImgError ? (
              <img
                src="https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&q=80"
                alt="Intel Core i9-14900KS"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setIntelImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-accent-blue">
                <Icon name="memory" size={32} />
              </div>
            )}
          </div>
        </div>

        {/* Strip Card 2: Apex Workstations */}
        <div className="group relative rounded-xl border border-[#292a2e] bg-[#16171d] hover:border-accent-blue/50 p-5 md:p-6 flex items-center justify-between gap-4 transition-all duration-300 shadow-lg">
          <div className="flex-1 min-w-0 z-10">
            <span className="inline-block font-mono text-[9px] text-stock-green bg-stock-green/10 px-2 py-0.5 rounded border border-stock-green/30 font-bold uppercase mb-2">
              WORKSTATION SYSTEMS
            </span>
            <h3 className="text-white font-bold text-base md:text-lg tracking-tight truncate group-hover:text-accent-blue transition-colors">
              APEX WORKSTATIONS
            </h3>
            <p className="text-outline text-xs leading-relaxed mt-1 mb-3 line-clamp-1">
              Pre-configured for rendering and ML.
            </p>
            <Link
              to="/gaming-pcs?type=workstation"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-blue font-bold tracking-wider hover:text-[#adc6ff] transition-colors"
            >
              <span>EXPLORE BUILDS</span>
              <Icon name="arrow_forward" size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-[#121317] border border-[#292a2e] shrink-0 overflow-hidden relative">
            {!apexImgError ? (
              <img
                src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&q=80"
                alt="Apex Workstations"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setApexImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-accent-blue">
                <Icon name="desktop_windows" size={32} />
              </div>
            )}
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
    <div className="relative rounded-2xl overflow-hidden bg-[#16171d] flex flex-col justify-end group min-h-65 sm:min-h-70 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div
        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#0d0e12] via-[#0d0e12]/80 to-transparent z-1" />
      <div className="absolute inset-0 bg-linear-to-t from-[#0d0e12] via-transparent to-transparent z-1" />

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
        <p className="text-outline text-xs mb-4 line-clamp-2">{subtitle}</p>
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
