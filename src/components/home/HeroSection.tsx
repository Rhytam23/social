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
      {/* ─── MAIN RTX 5090 CAMPAIGN HERO (620–720px Height Desktop) ─── */}
      <div className="cinematic-hero-card relative w-full rounded-2xl bg-[#121317] overflow-hidden min-h-145 md:min-h-160 lg:min-h-170 flex flex-col justify-between p-6 sm:p-10 lg:p-16 shadow-2xl">
        {/* Background Cinematic Glows & Lighting */}
        <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-125 sm:w-162.5 lg:w-212.5 h-125 sm:h-162.5 lg:h-212.5 bg-accent-blue/15 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="hero-bg-gradient absolute inset-0 bg-linear-to-r from-[#121317] via-[#121317]/95 to-transparent z-1 pointer-events-none hidden lg:block" />
        <div className="hero-bg-gradient-mobile absolute inset-0 bg-linear-to-t from-[#121317] via-[#121317]/70 to-transparent z-1 pointer-events-none lg:hidden" />

        {/* Desktop 40/60 Layout Container */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center h-full my-auto">
          {/* Left Column: 40% Width Typography & CTAs */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center order-1 lg:order-1">
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-blue/10 rounded text-accent-blue font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] w-fit mb-5 shadow-[0_0_15px_rgba(0,122,255,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
              {heroCampaign.badge}
            </div>

            {/* Headline */}
            <h1 className="font-black tracking-tighter leading-[0.92] text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-6">
              <span className="hero-headline-primary text-white block">{heroCampaign.headlinePrimary}</span>
              <span className="text-accent-blue block mt-1">{heroCampaign.headlineAccent}</span>
            </h1>

            {/* GPU Visual - Mobile Only */}
            <div className="block lg:hidden my-4 relative w-full aspect-16/10 max-h-70 mx-auto order-2">
              {!gpuImgError ? (
                <img
                  src={heroCampaign.image}
                  alt={heroCampaign.headlinePrimary}
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,122,255,0.35)]"
                  onError={() => setGpuImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#16171d] rounded-lg">
                  <Icon name="videogame_asset" size={56} className="text-accent-blue" />
                  <span className="font-mono text-xs text-outline mt-2">RTX 5090 FE</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="hero-subtext text-outline text-sm sm:text-base lg:text-lg max-w-112.5 leading-relaxed mb-8 order-3 font-normal">
              {heroCampaign.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 order-4">
              <Link
                to={heroCampaign.primaryCtaHref}
                className="h-12 md:h-14 px-7 md:px-8 bg-accent-blue hover:bg-[#0066d6] active:scale-[0.98] text-white font-mono text-xs md:text-sm font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,122,255,0.4)] transition-all"
              >
                <span>{heroCampaign.primaryCtaLabel}</span>
                <Icon name="arrow_forward" size={16} />
              </Link>

              <Link
                to={heroCampaign.secondaryCtaHref}
                className="hero-sec-btn h-12 md:h-14 px-7 md:px-8 bg-[#16171d]/90 hover:bg-[#1a1b22] text-white font-mono text-xs md:text-sm font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>{heroCampaign.secondaryCtaLabel}</span>
                <Icon name="memory" size={16} className="text-accent-blue" />
              </Link>
            </div>
          </div>

          {/* Right Column: 60% Width Hardware Visual (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 relative items-center justify-center order-2 h-full">
            <div className="relative w-full max-w-185 aspect-16/10 flex items-center justify-center">
              {/* Outer Rim Ambient Glow */}
              <div className="absolute inset-0 bg-linear-to-tr from-accent-blue/25 via-transparent to-accent-blue/15 rounded-3xl blur-3xl pointer-events-none" />

              {!gpuImgError ? (
                <img
                  src={heroCampaign.image}
                  alt={heroCampaign.headlinePrimary}
                  className="w-full h-full object-contain filter drop-shadow-[0_25px_50px_rgba(0,122,255,0.4)] hover:scale-[1.02] transition-transform duration-700 select-none z-10"
                  onError={() => setGpuImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#16171d] rounded-xl p-8 z-10">
                  <Icon name="videogame_asset" size={96} className="text-accent-blue" />
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
