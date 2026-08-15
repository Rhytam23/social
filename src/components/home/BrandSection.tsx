import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Brand } from '../../types'
import { Icon } from '../ui'

// ─── Brand Partner Data Model ────────────────────────────────────────────────

interface BrandPartnerConfig {
  id: string
  name: string
  href: string
  description: string
  maxW: string
  renderSvg: () => React.ReactNode
}

const BRAND_PARTNERS_CONFIG: BrandPartnerConfig[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA',
    href: '/brands',
    description: 'GeForce RTX GPUs',
    maxW: 'max-w-[135px]',
    renderSvg: () => (
      <svg viewBox="0 0 160 48" className="h-8 md:h-10 w-auto max-w-[135px] max-h-[44px] object-contain select-none shrink-0">
        <g fill="#76B900">
          <path d="M38 12c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14-6.3-14-14-14zm0 22.5c-4.7 0-8.5-3.8-8.5-8.5s3.8-8.5 8.5-8.5 8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z" />
          <path d="M14 4C6.3 4 0 10.3 0 18s6.3 14 14 14c5.8 0 10.7-3.6 12.6-8.8h-5.8c-1.5 2.6-4.3 4.4-7.6 4.4-4.8 0-8.7-3.9-8.7-8.7S8.4 10.2 13.2 10.2c3.3 0 6.1 1.8 7.6 4.4h5.8C24.7 9.4 19.8 4 14 4z" />
        </g>
        <text x="58" y="32" fill="#76B900" fontFamily="system-ui, -apple-system, sans-serif" fontSize="24" fontWeight="900" letterSpacing="-0.5px">
          NVIDIA
        </text>
      </svg>
    ),
  },
  {
    id: 'amd',
    name: 'AMD',
    href: '/brands',
    description: 'Ryzen & Radeon',
    maxW: 'max-w-[125px]',
    renderSvg: () => (
      <svg viewBox="0 0 140 44" className="h-8 md:h-10 w-auto max-w-[125px] max-h-[44px] object-contain select-none shrink-0">
        <path fill="#ED1C24" d="M0 6h22v22H0zM26 6h12v5H32v5h12v5H32v5h12v5H26zM46 6h6l12 15V6h6v30h-6L52 18v18h-6z" />
        <text x="0" y="32" fill="#ED1C24" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" letterSpacing="1px">
          AMD
        </text>
      </svg>
    ),
  },
  {
    id: 'intel',
    name: 'Intel',
    href: '/brands',
    description: 'Core Desktop CPUs',
    maxW: 'max-w-[115px]',
    renderSvg: () => (
      <svg viewBox="0 0 130 44" className="h-8 md:h-10 w-auto max-w-[115px] max-h-[44px] object-contain select-none shrink-0">
        <text x="5" y="33" fill="#00C7FD" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="800" fontStyle="italic" letterSpacing="-1.5px">
          intel
        </text>
      </svg>
    ),
  },
  {
    id: 'asus-rog',
    name: 'ASUS ROG',
    href: '/brands',
    description: 'Republic of Gamers',
    maxW: 'max-w-[135px]',
    renderSvg: () => (
      <svg viewBox="0 0 170 44" className="h-8 md:h-10 w-auto max-w-[135px] max-h-[44px] object-contain select-none shrink-0">
        <path fill="#FF4655" d="M12 4C26 2 44 8 48 16c-9 0-20 5-26 13zM48 12c8-4 20-10 26-12-8 14-28 18-35 9z" />
        <text x="0" y="36" fill="#FF4655" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="900" letterSpacing="1.5px">
          REPUBLIC OF GAMERS
        </text>
      </svg>
    ),
  },
  {
    id: 'msi',
    name: 'MSI',
    href: '/brands',
    description: 'SUPRIM & MEG',
    maxW: 'max-w-[115px]',
    renderSvg: () => (
      <svg viewBox="0 0 130 44" className="h-8 md:h-10 w-auto max-w-[115px] max-h-[44px] object-contain select-none shrink-0">
        <text x="8" y="33" fill="#FF3333" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="900" letterSpacing="3px">
          msi
        </text>
      </svg>
    ),
  },
  {
    id: 'corsair',
    name: 'Corsair',
    href: '/brands',
    description: 'Dominator & Vengeance',
    maxW: 'max-w-[135px]',
    renderSvg: () => (
      <svg viewBox="0 0 160 44" className="h-8 md:h-10 w-auto max-w-[135px] max-h-[44px] object-contain select-none shrink-0">
        <g fill="#FFDE00">
          <path d="M10 6l12 24H0zM26 6l12 24H14zM42 6l12 24H30z" />
        </g>
        <text x="58" y="30" fill="#FFDE00" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="900" letterSpacing="2px">
          CORSAIR
        </text>
      </svg>
    ),
  },
  {
    id: 'nzxt',
    name: 'NZXT',
    href: '/brands',
    description: 'Kraken & H-Series',
    maxW: 'max-w-[115px]',
    renderSvg: () => (
      <svg viewBox="0 0 130 44" className="h-8 md:h-10 w-auto max-w-[115px] max-h-[44px] object-contain select-none shrink-0">
        <text x="8" y="33" fill="#FF2D55" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="900" letterSpacing="2px">
          NZXT
        </text>
      </svg>
    ),
  },
  {
    id: 'samsung',
    name: 'Samsung',
    href: '/brands',
    description: '990 PRO NVMe',
    maxW: 'max-w-[130px]',
    renderSvg: () => (
      <svg viewBox="0 0 160 44" className="h-8 md:h-10 w-auto max-w-[130px] max-h-[44px] object-contain select-none shrink-0">
        <ellipse cx="80" cy="22" rx="74" ry="18" fill="#1428A0" />
        <text x="22" y="28" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="17" fontWeight="900" letterSpacing="2px">
          SAMSUNG
        </text>
      </svg>
    ),
  },
]

// ─── Brand Card Component ─────────────────────────────────────────────────────

function BrandCardItem({ config }: { config: BrandPartnerConfig }) {
  const [hasError] = useState(false)

  return (
    <Link
      to={config.href}
      className="group relative flex flex-col items-center justify-between p-4 bg-[#121317] rounded-2xl transition-all duration-300 w-[190px] sm:w-[210px] md:w-[220px] h-[135px] md:h-[145px] shrink-0 overflow-hidden text-center shadow-md hover:shadow-2xl hover:-translate-y-1 select-none"
    >
      {/* Dedicated Logo Container Area */}
      <div className="w-full h-[60px] md:h-[68px] flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105 shrink-0 overflow-hidden">
        {!hasError ? (
          config.renderSvg()
        ) : (
          <span className="font-mono text-sm md:text-base font-black tracking-wider text-white uppercase">
            {config.name}
          </span>
        )}
      </div>

      {/* Category Description Underneath */}
      <div className="w-full pt-2">
        <span className="font-mono text-[10px] md:text-[11px] text-[#8b90a0] group-hover:text-[#c1c6d7] transition-colors truncate block font-medium">
          {config.description}
        </span>
      </div>
    </Link>
  )
}

// ─── BrandSection Component (Strict Viewport & Duplicate Set Architecture) ───

interface BrandSectionProps {
  brands?: Brand[]
}

export function BrandSection({ brands: _brands }: BrandSectionProps = {}) {
  // Build exact duplicate array for seamless -50% translateX marquee loop
  const duplicateList = [...BRAND_PARTNERS_CONFIG, ...BRAND_PARTNERS_CONFIG]

  return (
    <section className="relative overflow-hidden bg-[#16171d] rounded-2xl p-6 md:p-8 shadow-2xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#007aff] animate-pulse inline-block" />
            <span className="font-mono text-xs text-[#007aff] font-bold tracking-widest uppercase">
              OFFICIAL PARTNERSHIPS
            </span>
          </div>
          <h2 className="text-white font-black text-xl md:text-2xl tracking-tight">
            Authorized Brand Partners
          </h2>
          <p className="text-[#8b90a0] text-xs mt-1">
            Direct retail partner with complete official manufacturer warranty support
          </p>
        </div>

        <Link
          to="/products"
          className="text-[#007aff] hover:text-[#adc6ff] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>ALL BRANDS</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Brand Viewport Container (overflow: hidden clipping boundary) */}

      {/* Brand Viewport Container (overflow: hidden clipping boundary) */}
      <div className="relative w-full overflow-hidden py-2">
        {/* Left & Right Edge Fading Overlays */}
        <div className="absolute top-0 bottom-0 left-0 w-12 md:w-20 bg-gradient-to-r from-[var(--bg-surface,#16171d)] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-12 md:w-20 bg-gradient-to-l from-[var(--bg-surface,#16171d)] to-transparent z-10 pointer-events-none" />

        {/* Moving Marquee Track (-50% keyframe translation) */}
        <div className="animate-marquee flex items-center gap-5 hover:[animation-play-state:paused] touch-pan-x">
          {duplicateList.map((config, idx) => (
            <BrandCardItem key={`${config.id}-${idx}`} config={config} />
          ))}
        </div>
      </div>
    </section>
  )
}
