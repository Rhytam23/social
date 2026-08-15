import { Link } from 'react-router-dom'
import type { Brand } from '../../types'
import { Icon } from '../ui'

interface BrandSectionProps {
  brands: Brand[]
}

const BRAND_DETAILS: Record<
  string,
  { color: string; tag: string; iconName: string }
> = {
  NVIDIA: { color: '#76b900', tag: 'GeForce RTX GPUs', iconName: 'videogame_asset' },
  AMD: { color: '#ed1c24', tag: 'Ryzen & Radeon', iconName: 'memory' },
  Intel: { color: '#00c7fd', tag: 'Core Desktop CPUs', iconName: 'memory' },
  'ASUS ROG': { color: '#ff4655', tag: 'Republic of Gamers', iconName: 'developer_board' },
  MSI: { color: '#ff3333', tag: 'SUPRIM & MEG', iconName: 'videogame_asset' },
  Corsair: { color: '#ffde00', tag: 'Dominator & Vengeance', iconName: 'storage' },
  NZXT: { color: '#ff2d55', tag: 'Kraken & H-Series', iconName: 'mode_fan' },
  Samsung: { color: '#5ac8fa', tag: '990 PRO NVMe', iconName: 'hard_drive' },
}

function BrandLogoBadge({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'NVIDIA':
      return (
        <span className="font-black text-xs tracking-tighter text-[#76b900] uppercase font-mono px-2 py-1 bg-[#76b90015] border border-[#76b90040] rounded">
          NVIDIA
        </span>
      )
    case 'AMD':
      return (
        <span className="font-black text-xs tracking-tighter text-[#ed1c24] uppercase font-mono px-2 py-1 bg-[#ed1c2415] border border-[#ed1c2440] rounded">
          AMD
        </span>
      )
    case 'Intel':
      return (
        <span className="font-black text-xs tracking-tighter text-[#00c7fd] uppercase font-mono px-2 py-1 bg-[#00c7fd15] border border-[#00c7fd40] rounded">
          INTEL
        </span>
      )
    case 'ASUS ROG':
      return (
        <span className="font-black text-xs tracking-tighter text-[#ff4655] uppercase font-mono px-2 py-1 bg-[#ff465515] border border-[#ff465540] rounded">
          ASUS ROG
        </span>
      )
    case 'MSI':
      return (
        <span className="font-black text-xs tracking-tighter text-[#ff3333] uppercase font-mono px-2 py-1 bg-[#ff333315] border border-[#ff333340] rounded">
          MSI
        </span>
      )
    case 'Corsair':
      return (
        <span className="font-black text-xs tracking-tighter text-[#ffde00] uppercase font-mono px-2 py-1 bg-[#ffde0015] border border-[#ffde0040] rounded">
          CORSAIR
        </span>
      )
    case 'NZXT':
      return (
        <span className="font-black text-xs tracking-tighter text-[#ff2d55] uppercase font-mono px-2 py-1 bg-[#ff2d5515] border border-[#ff2d5540] rounded">
          NZXT
        </span>
      )
    case 'Samsung':
      return (
        <span className="font-black text-xs tracking-tighter text-[#5ac8fa] uppercase font-mono px-2 py-1 bg-[#5ac8fa15] border border-[#5ac8fa40] rounded">
          SAMSUNG
        </span>
      )
    default:
      return (
        <span className="font-black text-xs tracking-tighter uppercase font-mono px-2 py-1 rounded" style={{ color }}>
          {name}
        </span>
      )
  }
}

function BrandCard({ brand }: { brand: Brand }) {
  const detail = BRAND_DETAILS[brand.name] || {
    color: '#007aff',
    tag: 'Official Hardware',
    iconName: 'verified',
  }

  return (
    <Link
      to={brand.href}
      className="group relative flex items-center gap-3.5 p-3.5 bg-[#121317] border border-[#292a2e] hover:border-[#007aff] rounded-lg transition-all duration-300 min-w-[200px] sm:min-w-[220px] min-h-[96px] shrink-0 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Brand Badge Preview */}
      <div className="w-14 h-14 rounded-md bg-[#16171d] border border-[#292a2e] shrink-0 overflow-hidden relative flex items-center justify-center p-1">
        <BrandLogoBadge name={brand.name} color={detail.color} />
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
      <div className="relative w-full overflow-hidden py-1">
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
