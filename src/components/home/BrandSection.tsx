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

function BrandLogoText({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="font-black text-sm md:text-base tracking-tighter uppercase font-mono transition-transform duration-200 group-hover:scale-105"
      style={{ color }}
    >
      {name}
    </span>
  )
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
      className="group relative flex flex-col justify-center items-start p-4 bg-[#121317] border border-[#292a2e] hover:border-[#007aff] rounded-lg transition-all duration-300 min-w-[170px] sm:min-w-[190px] min-h-[86px] shrink-0 hover:shadow-xl hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: detail.color }}
        />
        <BrandLogoText name={brand.name} color={detail.color} />
      </div>

      <span className="font-mono text-[10px] text-[#8b90a0] group-hover:text-[#c1c6d7] transition-colors truncate w-full pl-3.5">
        {detail.tag}
      </span>

      <span className="font-mono text-[9px] text-[#30d158] font-bold mt-1.5 flex items-center gap-0.5 pl-3.5">
        <Icon name="check_circle" size={11} /> AUTHORIZED
      </span>
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
