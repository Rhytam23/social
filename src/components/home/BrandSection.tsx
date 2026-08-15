import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Brand } from '../../types'
import { Icon } from '../ui'

interface BrandSectionProps {
  brands: Brand[]
}

const BRAND_DETAILS: Record<
  string,
  { color: string; tag: string; icon: string; logoUrl?: string }
> = {
  NVIDIA: {
    color: '#76b900',
    tag: 'GeForce RTX GPUs',
    icon: 'videogame_asset',
    logoUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&q=80',
  },
  AMD: {
    color: '#ed1c24',
    tag: 'Ryzen & Radeon',
    icon: 'memory',
    logoUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&q=80',
  },
  Intel: {
    color: '#00c7fd',
    tag: 'Core Desktop CPUs',
    icon: 'memory',
    logoUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&q=80',
  },
  'ASUS ROG': {
    color: '#ff4655',
    tag: 'Republic of Gamers',
    icon: 'developer_board',
    logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80',
  },
  MSI: {
    color: '#ff3333',
    tag: 'SUPRIM & MEG',
    icon: 'videogame_asset',
    logoUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&q=80',
  },
  Corsair: {
    color: '#ffde00',
    tag: 'Dominator & Vengeance',
    icon: 'storage',
    logoUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=300&q=80',
  },
  NZXT: {
    color: '#ff2d55',
    tag: 'Kraken & H-Series',
    icon: 'mode_fan',
    logoUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&q=80',
  },
  Samsung: {
    color: '#5ac8fa',
    tag: '990 PRO NVMe',
    icon: 'hard_drive',
    logoUrl: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=300&q=80',
  },
}

function BrandCard({ brand }: { brand: Brand }) {
  const [imgError, setImgError] = useState(false)
  const detail = BRAND_DETAILS[brand.name] || {
    color: '#007aff',
    tag: 'Official Hardware',
    icon: 'verified',
  }

  return (
    <Link
      to={brand.href}
      className="group relative flex items-center gap-3.5 p-3.5 bg-[#121317] border border-[#292a2e] hover:border-[#007aff] rounded-lg transition-all duration-300 min-w-[190px] sm:min-w-[210px] min-h-[96px] shrink-0 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Background Graphic Preview */}
      <div className="w-14 h-14 rounded-md bg-[#16171d] border border-[#292a2e] shrink-0 overflow-hidden relative flex items-center justify-center">
        {!imgError && detail.logoUrl ? (
          <img
            src={detail.logoUrl}
            alt={brand.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-bold"
            style={{ color: detail.color }}
          >
            <Icon name={detail.icon} size={24} />
          </div>
        )}
      </div>

      {/* Brand Text Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: detail.color }}
          />
          <span className="font-black text-sm text-white tracking-tight group-hover:text-[#007aff] transition-colors truncate">
            {brand.name}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#8b90a0] group-hover:text-[#c1c6d7] transition-colors truncate">
          {detail.tag}
        </span>
        <span className="font-mono text-[9px] text-[#30d158] font-bold mt-1 flex items-center gap-0.5">
          <Icon name="check_circle" size={11} /> AUTHORIZED
        </span>
      </div>
    </Link>
  )
}

export function BrandSection({ brands }: BrandSectionProps) {
  // Duplicate list for infinite horizontal marquee
  const marqueeList = [...brands, ...brands]

  return (
    <section className="overflow-hidden bg-[#16171d] border border-[#292a2e] rounded-xl p-5 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#292a2e]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#007aff] animate-pulse inline-block" />
            <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">
              Authorized Brand Partners
            </h2>
          </div>
          <p className="text-[#8b90a0] text-xs">
            Direct retail partner with complete official manufacturer warranty support
          </p>
        </div>

        <Link
          to="/products"
          className="text-[#007aff] hover:text-[#adc6ff] font-mono text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
        >
          <span>ALL BRANDS</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Animated Horizontal Marquee Container */}
      <div className="relative w-full overflow-hidden mask-gradient-x py-1">
        {/* Left/Right Fading Edge Overlays */}
        <div className="absolute top-0 bottom-0 left-0 w-8 md:w-16 bg-gradient-to-r from-[#16171d] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-8 md:w-16 bg-gradient-to-l from-[#16171d] to-transparent z-10 pointer-events-none" />

        {/* Moving Marquee Track */}
        <div className="animate-marquee flex items-center gap-4 hover:[animation-play-state:paused]">
          {marqueeList.map((brand, idx) => (
            <BrandCard key={`${brand.id}-${idx}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  )
}
