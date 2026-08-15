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

// ─── Official Brand Vector Logos ──────────────────────────────────────────────

function OfficialBrandLogo({ name }: { name: string }) {
  switch (name) {
    case 'NVIDIA':
      return (
        <svg viewBox="0 0 160 48" className="h-7 md:h-8 w-auto max-w-[125px] object-contain select-none">
          {/* NVIDIA Spiral + Wordmark */}
          <path
            fill="#76B900"
            d="M37.5 11.2c-7.9 0-14.3 6.4-14.3 14.3 0 7.9 6.4 14.3 14.3 14.3 7.9 0 14.3-6.4 14.3-14.3 0-7.9-6.4-14.3-14.3-14.3zm0 23.3c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"
          />
          <path
            fill="#76B900"
            d="M14.7 4C6.6 4 0 10.6 0 18.7s6.6 14.7 14.7 14.7c6.3 0 11.7-4 13.7-9.6h-6.4c-1.6 3.1-4.8 5.3-8.6 5.3-5.3 0-9.6-4.3-9.6-9.6s4.3-9.6 9.6-9.6c3.8 0 7 2.2 8.6 5.3h6.4C26.4 8 21 4 14.7 4z"
          />
          <text x="60" y="32" fill="#76B900" fontFamily="system-ui, sans-serif" fontSize="24" fontWeight="900" letterSpacing="-1px">
            NVIDIA
          </text>
        </svg>
      )

    case 'AMD':
      return (
        <svg viewBox="0 0 130 40" className="h-7 md:h-8 w-auto max-w-[110px] object-contain select-none">
          {/* AMD Arrow Icon + Wordmark */}
          <g fill="#ED1C24">
            <path d="M0 0h22v22H0z" />
            <path d="M26 0h12v5H32v5h12v5H32v5h12v5H26z" fill="#FFFFFF" />
            <path d="M46 0h6l12 15V0h6v30h-6L52 15v15h-6z" fill="#FFFFFF" />
          </g>
          <text x="0" y="28" fill="#ED1C24" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="1px">
            AMD
          </text>
        </svg>
      )

    case 'Intel':
      return (
        <svg viewBox="0 0 120 40" className="h-7 md:h-8 w-auto max-w-[105px] object-contain select-none">
          {/* Intel Classic Blue Wordmark */}
          <text x="5" y="30" fill="#00C7FD" fontFamily="system-ui, sans-serif" fontSize="32" fontWeight="800" fontStyle="italic" letterSpacing="-1.5px">
            intel
          </text>
        </svg>
      )

    case 'ASUS ROG':
      return (
        <svg viewBox="0 0 150 42" className="h-7 md:h-8 w-auto max-w-[130px] object-contain select-none">
          {/* ROG Eye Icon + Text */}
          <path fill="#FF4655" d="M12 5C25 3 45 10 50 18c-10 0-22 5-28 14zm40 10c8-5 22-12 28-15-8 15-32 20-40 10z" />
          <text x="2" y="36" fill="#FF4655" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="900" letterSpacing="1.5px">
            REPUBLIC OF GAMERS
          </text>
        </svg>
      )

    case 'MSI':
      return (
        <svg viewBox="0 0 120 40" className="h-7 md:h-8 w-auto max-w-[105px] object-contain select-none">
          {/* MSI Bold Red Wordmark */}
          <text x="5" y="30" fill="#FF3333" fontFamily="system-ui, sans-serif" fontSize="32" fontWeight="900" letterSpacing="3px">
            msi
          </text>
        </svg>
      )

    case 'Corsair':
      return (
        <svg viewBox="0 0 150 40" className="h-7 md:h-8 w-auto max-w-[130px] object-contain select-none">
          {/* Corsair Sails Icon + Wordmark */}
          <g fill="#FFDE00">
            <path d="M10 5l12 24H0zM26 5l12 24H14zM42 5l12 24H30z" />
          </g>
          <text x="58" y="28" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="900" letterSpacing="2px">
            CORSAIR
          </text>
        </svg>
      )

    case 'NZXT':
      return (
        <svg viewBox="0 0 120 40" className="h-7 md:h-8 w-auto max-w-[105px] object-contain select-none">
          {/* NZXT Purple Wordmark */}
          <text x="5" y="30" fill="#FF2D55" fontFamily="system-ui, sans-serif" fontSize="30" fontWeight="900" letterSpacing="2px">
            NZXT
          </text>
        </svg>
      )

    case 'Samsung':
      return (
        <svg viewBox="0 0 150 40" className="h-7 md:h-8 w-auto max-w-[130px] object-contain select-none">
          {/* Samsung Oval Logo */}
          <ellipse cx="75" cy="20" rx="70" ry="18" fill="#1428A0" />
          <text x="18" y="26" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontSize="17" fontWeight="900" letterSpacing="2px">
            SAMSUNG
          </text>
        </svg>
      )

    default:
      return (
        <span className="font-mono text-sm font-black text-white uppercase tracking-wider">
          {name}
        </span>
      )
  }
}

// ─── Brand Card ───────────────────────────────────────────────────────────────

function BrandCard({ brand }: { brand: Brand }) {
  const description = BRAND_DESCRIPTIONS[brand.name] || 'Official Hardware'

  return (
    <Link
      to={brand.href}
      className="group relative flex flex-col items-center justify-center p-4 bg-[#121317] border border-[#292a2e] hover:border-[#007aff] rounded-xl transition-all duration-300 min-w-[170px] sm:min-w-[190px] md:min-w-[210px] min-h-[105px] shrink-0 hover:shadow-2xl hover:-translate-y-1 overflow-hidden text-center"
    >
      {/* Prominent Official Logo in Center */}
      <div className="flex items-center justify-center h-10 mb-2 transition-transform duration-300 group-hover:scale-105">
        <OfficialBrandLogo name={brand.name} />
      </div>

      {/* Category Description Underneath */}
      <span className="font-mono text-[10px] md:text-[11px] text-[#8b90a0] group-hover:text-[#c1c6d7] transition-colors truncate max-w-full font-medium">
        {description}
      </span>
    </Link>
  )
}

// ─── BrandSection Component ───────────────────────────────────────────────────

export function BrandSection({ brands }: BrandSectionProps) {
  // Duplicate array for seamless horizontal marquee loop
  const marqueeList = [...brands, ...brands]

  return (
    <section className="overflow-hidden bg-[#16171d] border border-[#292a2e] rounded-2xl p-5 md:p-6 shadow-xl">
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

      {/* Animated Horizontal Marquee Track */}
      <div className="relative w-full overflow-hidden py-1">
        <div className="animate-marquee flex items-center gap-4 hover:[animation-play-state:paused]">
          {marqueeList.map((brand, idx) => (
            <BrandCard key={`${brand.id}-${idx}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  )
}
