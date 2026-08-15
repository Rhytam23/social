import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CategoryCard } from '../../types'
import { Icon } from '../ui'

const CATEGORY_ICONS: Record<string, string> = {
  'gaming-pcs': 'desktop_windows',
  gpus: 'videogame_asset',
  cpus: 'memory',
  motherboards: 'developer_board',
  ram: 'storage',
  storage: 'hard_drive',
  cooling: 'mode_fan',
  cases: 'inventory_2',
  psus: 'power',
  monitors: 'monitor',
  peripherals: 'keyboard',
  streaming: 'mic',
}

interface CategorySectionProps {
  categories: CategoryCard[]
}

function CategoryTile({ category, featured = false }: { category: CategoryCard; featured?: boolean }) {
  const [imgError, setImgError] = useState(false)
  const iconName = CATEGORY_ICONS[category.id] || 'hardware'

  return (
    <Link
      to={category.href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[#292a2e] bg-[#16171d] hover:border-[#007aff] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 ${
        featured ? 'col-span-1 sm:col-span-2 row-span-1 min-h-[220px] sm:min-h-[260px]' : 'col-span-1 min-h-[180px] sm:min-h-[210px]'
      }`}
    >
      {/* Background Hardware Photo */}
      {!imgError ? (
        <img
          src={category.image}
          alt={category.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#16171d] via-[#121317] to-[#0d0e12] flex items-center justify-center p-4">
          <div className="w-14 h-14 rounded-2xl bg-[#007aff]/15 border border-[#007aff]/30 flex items-center justify-center text-[#007aff]">
            <Icon name={iconName} size={28} />
          </div>
        </div>
      )}

      {/* Cinematic Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#007aff]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top Floating Badge */}
      <div className="relative z-10 p-4 flex justify-between items-start">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121317]/80 backdrop-blur-md border border-[#292a2e] rounded-md font-mono text-[10px] text-[#007aff] font-bold tracking-wider">
          <Icon name={iconName} size={14} />
          {category.itemCount} ITEMS
        </span>
      </div>

      {/* Bottom Content Body */}
      <div className="relative z-10 mt-auto p-4 sm:p-5">
        <h3 className={`text-white font-bold tracking-tight group-hover:text-[#007aff] transition-colors ${featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
          {category.title}
        </h3>
        
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-mono text-xs text-[#8b90a0]">
            {category.startingPrice ? `Starting at $${category.startingPrice}` : 'Explore Lineup'}
          </span>
          <span className="w-8 h-8 rounded-full bg-[#121317]/80 backdrop-blur-md border border-[#292a2e] group-hover:border-[#007aff] group-hover:bg-[#007aff] text-white flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 shrink-0">
            <Icon name="arrow_forward" size={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function CategorySection({ categories }: CategorySectionProps) {
  const featuredIds = ['gaming-pcs', 'gpus']

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-3 border-b border-[#292a2e]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#007aff] animate-pulse" />
            <span className="font-mono text-xs text-[#007aff] font-bold tracking-widest uppercase">HARDWARE SECTIONS</span>
          </div>
          <h2 className="text-white font-black text-2xl md:text-3xl tracking-tight">
            Explore Hardware Categories
          </h2>
        </div>
        <Link
          to="/categories"
          className="font-mono text-xs tracking-wider text-[#007aff] hover:text-[#adc6ff] transition-colors flex items-center gap-1 font-bold shrink-0"
        >
          <span>ALL CATEGORIES</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Bento Grid Composition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <CategoryTile key={cat.id} category={cat} featured={featuredIds.includes(cat.id)} />
        ))}
      </div>
    </section>
  )
}
