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
    maxW: 'max-w-33.75',
    renderSvg: () => (
      <svg viewBox="0 0 160 48" className="h-8 md:h-10 w-auto max-w-33.75 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-31.25',
    renderSvg: () => (
      <svg viewBox="0 0 140 44" className="h-8 md:h-10 w-auto max-w-31.25 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-28.75',
    renderSvg: () => (
      <svg viewBox="0 0 130 44" className="h-8 md:h-10 w-auto max-w-28.75 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-33.75',
    renderSvg: () => (
      <svg viewBox="0 0 170 44" className="h-8 md:h-10 w-auto max-w-33.75 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-28.75',
    renderSvg: () => (
      <svg viewBox="0 0 130 44" className="h-8 md:h-10 w-auto max-w-28.75 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-33.75',
    renderSvg: () => (
      <svg viewBox="0 0 160 44" className="h-8 md:h-10 w-auto max-w-33.75 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-28.75',
    renderSvg: () => (
      <svg viewBox="0 0 130 44" className="h-8 md:h-10 w-auto max-w-28.75 max-h-11 object-contain select-none shrink-0">
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
    maxW: 'max-w-32.5',
    renderSvg: () => (
      <svg viewBox="0 0 160 44" className="h-8 md:h-10 w-auto max-w-32.5 max-h-11 object-contain select-none shrink-0">
        <ellipse cx="80" cy="22" rx="74" ry="18" fill="#1428A0" />
        <text x="22" y="28" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="17" fontWeight="900" letterSpacing="2px">
          SAMSUNG
        </text>
      </svg>
    ),
  },
]

interface BrandSectionProps {
  brands?: Brand[]
}

export function BrandSection({ brands: _brands }: BrandSectionProps = {}) {
  return (
    <section className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 md:p-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">
            Authorized Brand Partners
          </h2>
          <p className="text-(--text-secondary) text-xs md:text-sm mt-0.5">
            Direct retail partner with official manufacturer warranty support
          </p>
        </div>

        <Link
          to="/brands"
          className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
        >
          <span>All Brands</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {BRAND_PARTNERS_CONFIG.map((config) => (
          <Link
            key={config.id}
            to={config.href}
            className="flex flex-col items-center justify-center p-3 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg hover:border-(--accent-blue) transition-all h-20 text-center"
          >
            <div className="h-8 flex items-center justify-center">
              {config.renderSvg()}
            </div>
            <span className="text-[11px] text-(--text-secondary) mt-1 font-medium truncate w-full">
              {config.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
