import { Link } from 'react-router-dom'
import type { Brand } from '../../types'
import { Icon } from '../ui'

interface BrandSectionProps {
  brands: Brand[]
}

const BRAND_ACCENTS: Record<string, { text: string; sub: string }> = {
  NVIDIA: { text: '#76b900', sub: 'RTX GPUs' },
  AMD: { text: '#ed1c24', sub: 'Ryzen & Radeon' },
  Intel: { text: '#00c7fd', sub: 'Core Desktop' },
  'ASUS ROG': { text: '#ff4655', sub: 'Republic of Gamers' },
  MSI: { text: '#ff3333', sub: 'SUPRIM & MEG' },
  Corsair: { text: '#ffde00', sub: 'RAM & PSUs' },
  NZXT: { text: '#ff2d55', sub: 'Kraken & H-Series' },
  Samsung: { text: '#5ac8fa', sub: '990 PRO NVMe' },
  Razer: { text: '#00ff00', sub: 'Chroma & Peripherals' },
  Logitech: { text: '#00a8ff', sub: 'LIGHTSPEED Gear' },
}

export function BrandSection({ brands }: BrandSectionProps) {
  // Duplicate brand array for seamless infinite marquee loop
  const marqueeList = [...brands, ...brands]

  return (
    <section className="overflow-hidden bg-[#16171d] border border-[#292a2e] rounded-lg p-5 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#292a2e]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#007aff] animate-pulse inline-block" />
            <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">Authorized Brand Partners</h2>
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
        <div className="animate-marquee flex items-center gap-3.5 hover:[animation-play-state:paused]">
          {marqueeList.map((brand, idx) => {
            const accent = BRAND_ACCENTS[brand.name] || { text: '#adc6ff', sub: 'Hardware' }

            return (
              <Link
                key={`${brand.id}-${idx}`}
                to={brand.href}
                className="group flex flex-col items-center justify-center p-3.5 bg-[#121317] border border-[#292a2e] rounded-md hover:border-[#007aff] transition-all duration-200 text-center min-w-[140px] sm:min-w-[160px] md:min-w-[170px] min-h-[90px] shrink-0 hover:shadow-lg"
              >
                <span
                  className="font-black text-sm tracking-tight transition-transform duration-200 group-hover:scale-105"
                  style={{ color: accent.text }}
                >
                  {brand.name}
                </span>
                <span className="font-mono text-[10px] text-[#8b90a0] mt-1 group-hover:text-[#c1c6d7] transition-colors">
                  {accent.sub}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
