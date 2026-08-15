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

interface CategoryCardProps {
  category: CategoryCard
}

function CategoryCardItem({ category }: CategoryCardProps) {
  const [imgError, setImgError] = useState(false)
  const iconName = CATEGORY_ICONS[category.id] || 'hardware'

  return (
    <Link
      to={category.href}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-[#292a2e] bg-[#16171d] hover:border-[#007aff] transition-all duration-300 shadow-md hover:shadow-xl"
      style={{ aspectRatio: '1/1' }}
    >
      {/* Image Element with Error Fallback */}
      {!imgError ? (
        <img
          src={category.image}
          alt={category.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#16171d] via-[#121317] to-[#0d0e12] flex items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full bg-[#007aff15] border border-[#007aff30] flex items-center justify-center text-[#007aff]">
            <Icon name={iconName} size={24} />
          </div>
        </div>
      )}

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/60 to-transparent" />

      {/* Card Text Content */}
      <div className="relative z-10 mt-auto p-3.5">
        <h3 className="text-white font-bold text-sm tracking-tight group-hover:text-[#adc6ff] transition-colors line-clamp-1">
          {category.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[10px] text-[#8b90a0] tracking-wider font-medium">
            {category.itemCount} items
            {category.startingPrice && ` · from $${category.startingPrice}`}
          </span>
          <Icon
            name="arrow_forward"
            size={14}
            className="text-[#8b90a0] group-hover:text-[#adc6ff] group-hover:translate-x-1 transition-all"
          />
        </div>
      </div>
    </Link>
  )
}

interface CategorySectionProps {
  categories: CategoryCard[]
}

export function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#292a2e]">
        <div>
          <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">Shop by Category</h2>
          <p className="text-[#8b90a0] text-xs mt-0.5">Explore our wide range of PC components and systems</p>
        </div>
        <Link
          to="/categories"
          className="font-mono text-xs tracking-wider text-[#007aff] hover:text-[#adc6ff] transition-colors flex items-center gap-1 font-bold"
        >
          <span>ALL CATEGORIES</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {categories.map((cat) => (
          <CategoryCardItem key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  )
}
