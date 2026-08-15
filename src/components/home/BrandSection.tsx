import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Brand } from '../../types'
import { Icon } from '../ui'

interface BrandSectionProps {
  brands: Brand[]
}

const BRAND_DESCRIPTIONS: Record<string, string> = {
  NVIDIA: 'RTX GPUs',
  AMD: 'Ryzen & Radeon',
  Intel: 'Core Desktop CPUs',
  'ASUS ROG': 'Republic of Gamers',
  MSI: 'SUPRIM & MEG',
  Corsair: 'Dominator & Vengeance',
  NZXT: 'Kraken & H-Series',
  Samsung: '990 PRO NVMe',
}

// ─── Official Brand Vector Logos (Pixel-Perfect ViewBox & Theme Compatible) ──

function OfficialBrandLogo({ name }: { name: string }) {
  const [imgError, setImgError] = useState(false)

  switch (name) {
    case 'NVIDIA':
      return !imgError ? (
        <img
          src="/logos/nvidia.png"
          alt="NVIDIA"
          className="h-7 md:h-8 w-auto max-w-[130px] max-h-[38px] object-contain select-none shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg viewBox="0 0 140 36" className="h-7 md:h-8 w-auto max-w-[120px] max-h-[36px] object-contain select-none shrink-0">
          <path
            fill="#76B900"
            d="M30 6c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12S36.6 6 30 6zm0 19.5c-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5 7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5zM11.5 0C5.1 0 0 5.1 0 11.5s5.1 11.5 11.5 11.5c5 0 9.2-3.1 10.8-7.5h-5c-1.3 2.2-3.7 3.8-6.8 3.8-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5c3.1 0 5.5 1.6 6.8 3.8h5C20.7 3.1 16.5 0 11.5 0z"
          />
          <text x="48" y="25" fill="#76B900" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="900" letterSpacing="-0.5px">
            NVIDIA
          </text>
        </svg>
      )

    case 'AMD':
      return (
        <svg viewBox="0 0 120 36" className="h-7 md:h-8 w-auto max-w-[115px] max-h-[36px] object-contain select-none shrink-0">
          <path fill="#ED1C24" d="M0 4h18v18H0zM22 4h11v4h-7v3h7v4h-7v3h7v4H22zM36 4h5l9 12V4h5v20h-5L41 13v11h-5z" />
          <text x="0" y="27" fill="#ED1C24" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="900" letterSpacing="1px">
            AMD
          </text>
        </svg>
      )

    case 'Intel':
      return (
        <svg viewBox="0 0 120 36" className="h-7 md:h-8 w-auto max-w-[115px] max-h-[36px] object-contain select-none shrink-0">
          <text x="10" y="27" fill="#00C7FD" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="800" fontStyle="italic" letterSpacing="-1px">
            intel
          </text>
        </svg>
      )

    case 'ASUS ROG':
    case 'ASUS':
      return !imgError ? (
        <img
          src="/logos/asus.png"
          alt="ASUS"
          className="h-7 md:h-8 w-auto max-w-[125px] max-h-[38px] object-contain select-none shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg viewBox="0 0 160 36" className="h-7 md:h-8 w-auto max-w-[130px] max-h-[36px] object-contain select-none shrink-0">
          <path fill="#FF4655" d="M10 2C22 1 38 6 42 13c-8 0-18 4-23 11zM42 10c7-4 18-9 23-11-7 12-25 16-31 8z" />
          <text x="0" y="30" fill="#FF4655" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="900" letterSpacing="1.2px">
            REPUBLIC OF GAMERS
          </text>
        </svg>
      )

    case 'MSI':
      return (
        <svg viewBox="0 0 120 36" className="h-7 md:h-8 w-auto max-w-[110px] max-h-[36px] object-contain select-none shrink-0">
          <text x="10" y="27" fill="#FF3333" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="2.5px">
            msi
          </text>
        </svg>
      )

    case 'Corsair':
      return (
        <svg viewBox="0 0 150 36" className="h-7 md:h-8 w-auto max-w-[125px] max-h-[36px] object-contain select-none shrink-0">
          <g fill="#FFDE00">
            <path d="M8 4l10 20H0zM22 4l10 20H14zM36 4l10 20H28z" />
          </g>
          <text x="52" y="24" fill="#FFDE00" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="900" letterSpacing="1.5px">
            CORSAIR
          </text>
        </svg>
      )

    case 'NZXT':
      return (
        <svg viewBox="0 0 120 36" className="h-7 md:h-8 w-auto max-w-[110px] max-h-[36px] object-contain select-none shrink-0">
          <text x="10" y="27" fill="#FF2D55" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="2px">
            NZXT
          </text>
        </svg>
      )

    case 'Samsung':
      return !imgError ? (
        <img
          src="/logos/samsung.png"
          alt="SAMSUNG"
          className="h-7 md:h-8 w-auto max-w-[130px] max-h-[38px] object-contain select-none shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg viewBox="0 0 140 36" className="h-7 md:h-8 w-auto max-w-[125px] max-h-[36px] object-contain select-none shrink-0">
          <ellipse cx="70" cy="18" rx="66" ry="16" fill="#1428A0" />
          <text x="22" y="23" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontSize="15" fontWeight="900" letterSpacing="1.8px">
            SAMSUNG
          </text>
        </svg>
      )

    default:
      return (
        <span className="font-mono text-sm font-black uppercase tracking-wider text-current">
          {name}
        </span>
      )
  }
}

// ─── Brand Card Component (Fixed Dimensions & No Shrink) ──────────────────────

function BrandCard({ brand }: { brand: Brand }) {
  const description = BRAND_DESCRIPTIONS[brand.name] || 'Official Hardware'

  return (
    <Link
      to={brand.href}
      className="group relative flex flex-col items-center justify-center p-3.5 md:p-4 bg-[#121317] border border-[#292a2e] hover:border-[#007aff] rounded-xl transition-all duration-300 w-[180px] sm:w-[200px] md:w-[220px] h-[105px] md:h-[115px] shrink-0 overflow-hidden text-center hover:shadow-xl hover:-translate-y-0.5 select-none"
    >
      {/* Prominent Official Logo Centered */}
      <div className="flex items-center justify-center h-9 md:h-10 mb-1.5 transition-transform duration-300 group-hover:scale-105 shrink-0">
        <OfficialBrandLogo name={brand.name} />
      </div>

      {/* Category Description Underneath */}
      <span className="font-mono text-[10px] md:text-[11px] text-[#8b90a0] group-hover:text-[#c1c6d7] transition-colors truncate max-w-full font-medium shrink-0">
        {description}
      </span>
    </Link>
  )
}

// ─── BrandSection Component (Viewport -> Track -> Duplicate Sets Architecture)

export function BrandSection({ brands }: BrandSectionProps) {
  // Guarantee exact duplicate array for seamless infinite marquee loop (-50% translation)
  const duplicateMarqueeList = [...brands, ...brands]

  return (
    <section className="relative overflow-hidden bg-[#16171d] border border-[#292a2e] rounded-2xl p-5 md:p-6 shadow-xl">
      {/* Section Header */}
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

      {/* Outer Viewport (overflow: hidden clipping boundary) */}
      <div className="relative w-full overflow-hidden py-1">
        {/* Left & Right Edge Fading Overlays */}
        <div className="absolute top-0 bottom-0 left-0 w-10 md:w-16 bg-gradient-to-r from-[var(--bg-surface,#16171d)] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-10 md:w-16 bg-gradient-to-l from-[var(--bg-surface,#16171d)] to-transparent z-10 pointer-events-none" />

        {/* Moving Marquee Track (-50% keyframe translation) */}
        <div className="animate-marquee flex items-center gap-4 hover:[animation-play-state:paused] touch-pan-x">
          {duplicateMarqueeList.map((brand, idx) => (
            <BrandCard key={`${brand.id}-${idx}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  )
}
