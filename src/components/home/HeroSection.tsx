import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui'

// ─── Carousel Slide Data ──────────────────────────────────────────────────────

interface HeroSlide {
  id: string
  badge: string
  badgeColor: string
  headline: string
  headlineAccent: string
  description: string
  image: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
}

const SLIDES: HeroSlide[] = [
  {
    id: 'rtx-5090',
    badge: 'New Arrival',
    badgeColor: '#007aff',
    headline: 'NVIDIA RTX 5090',
    headlineAccent: 'Founders Edition',
    description: '32GB GDDR7 · Blackwell Architecture · The new standard for 4K ray tracing and AI workloads.',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=90',
    primaryCta: { label: 'Shop Graphics Cards', href: '/graphics-cards' },
    secondaryCta: { label: 'View Specs', href: '/products/nvidia-geforce-rtx-5090-fe' },
  },
  {
    id: 'apex-titan',
    badge: 'Featured Build',
    badgeColor: '#30d158',
    headline: 'APEX TITAN ZERO',
    headlineAccent: 'RTX 5090 · i9-14900KS',
    description: 'Our flagship gaming PC — 4K 165fps, 64GB DDR5, 4TB Gen5 NVMe. Stress-tested 72 hours.',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=1200&q=90',
    primaryCta: { label: 'Shop Gaming PCs', href: '/gaming-pcs' },
    secondaryCta: { label: 'Build Your Own', href: '/builder' },
  },
  {
    id: 'gpu-deals',
    badge: 'Limited Time',
    badgeColor: '#ff6b00',
    headline: 'GPU Deals',
    headlineAccent: 'Up to 15% Off',
    description: 'Save on RTX 4090, RTX 4080 SUPER, and RX 7900 XTX — while stock lasts.',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&q=90',
    primaryCta: { label: 'Shop Deals', href: '/deals' },
  },
  {
    id: 'pc-builder',
    badge: 'Custom Builds',
    badgeColor: '#bf5af2',
    headline: 'PC Builder',
    headlineAccent: 'Your Dream Rig',
    description: 'Pick your CPU, GPU, RAM, storage and more — see real-time compatibility and wattage.',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=1200&q=90',
    primaryCta: { label: 'Start Building', href: '/builder' },
    secondaryCta: { label: 'View Components', href: '/components' },
  },
  {
    id: 'processors',
    badge: 'Top Performance',
    badgeColor: '#ff453a',
    headline: 'Intel Core i9-14900KS',
    headlineAccent: '6.2 GHz Max Turbo',
    description: 'Extreme single-core speed for gaming and content creation. Unlocked and overclockable.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=90',
    primaryCta: { label: 'Shop Processors', href: '/cpus' },
  },
]

const AUTO_INTERVAL = 6000

// ─── HeroSection Carousel ─────────────────────────────────────────────────────

export function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const total = SLIDES.length

  // Auto-rotate with clean interval and functional update
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((curr) => (curr + 1) % total)
    }, AUTO_INTERVAL)

    return () => clearInterval(timer)
  }, [isPaused, total])

  return (
    <section className="w-full max-w-container mx-auto">
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slide Content */}
        <div className="relative min-h-85 sm:min-h-95 lg:min-h-105">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 transition-all duration-500 ease-in-out"
              style={{
                opacity: i === current ? 1 : 0,
                visibility: i === current ? 'visible' : 'hidden',
                pointerEvents: i === current ? 'auto' : 'none',
              }}
            >
              <div className="h-full grid grid-cols-1 lg:grid-cols-2 items-center px-6 sm:px-10 lg:px-14 py-8 sm:py-10 lg:py-12 gap-6 lg:gap-4">
                {/* Left: Text */}
                <div className="flex flex-col justify-center z-10 order-1">
                  <span
                    className="inline-block w-fit text-[11px] font-bold uppercase tracking-wider text-white px-2.5 py-1 rounded mb-4"
                    style={{ backgroundColor: s.badgeColor }}
                  >
                    {s.badge}
                  </span>

                  <h2 className="font-bold tracking-tight leading-[1.1] text-(--text-primary) text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem]">
                    {s.headline}
                  </h2>
                  <span className="text-(--accent-blue) font-bold text-lg sm:text-xl lg:text-2xl xl:text-[1.75rem] mt-1 block">
                    {s.headlineAccent}
                  </span>

                  <p className="text-(--text-secondary) text-sm sm:text-[15px] leading-relaxed mt-3 mb-6 max-w-md">
                    {s.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={s.primaryCta.href}
                      className="h-11 px-7 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {s.primaryCta.label}
                      <Icon name="arrow_forward" size={16} />
                    </Link>

                    {s.secondaryCta && (
                      <Link
                        to={s.secondaryCta.href}
                        className="h-11 px-6 border border-(--border-theme) hover:border-(--text-primary) text-(--text-primary) bg-(--bg-surface-secondary) text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        {s.secondaryCta.label}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right: Product Image */}
                <div className="hidden lg:flex items-center justify-center order-2 h-full">
                  <img
                    src={s.image}
                    alt={s.headline}
                    className="w-full max-w-120 xl:max-w-135 aspect-4/3 object-cover rounded-xl select-none"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          ))}
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
    <div className="relative rounded-2xl overflow-hidden bg-(--bg-surface-secondary) flex flex-col justify-end group min-h-65 sm:min-h-70 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-(--border-theme)">
      <div
        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-(--bg-surface) via-(--bg-surface)/80 to-transparent z-1" />
      <div className="absolute inset-0 bg-linear-to-t from-(--bg-surface) via-transparent to-transparent z-1" />

      <div className="relative z-10">
        {badge && (
          <span
            className="inline-block mb-2 px-2.5 py-0.5 font-mono text-[10px] tracking-wider rounded text-white font-bold uppercase"
            style={{ backgroundColor: accentColor }}
          >
            {badge}
          </span>
        )}
        <h3 className="text-(--text-primary) font-bold text-lg sm:text-xl leading-snug mb-1">{title}</h3>
        <p className="text-(--text-secondary) text-xs mb-4 line-clamp-2">{subtitle}</p>
        <Link
          to={ctaHref}
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider text-(--accent-blue) hover:underline transition-colors font-bold group-hover:translate-x-1 cursor-pointer"
        >
          <span>{ctaLabel}</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>
    </div>
  )
}
