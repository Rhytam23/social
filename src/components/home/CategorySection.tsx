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
      className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 ${
        featured
          ? 'col-span-1 sm:col-span-2 row-span-1 min-h-60 sm:min-h-67.5'
          : 'col-span-1 min-h-47.5 sm:min-h-55'
      } ${
        !imgError
          ? 'bg-[#16171d]'
          : 'bg-[#16171d] light-mode-non-img-card'
      }`}
    >
      {/* ── Image-based Card Layout ── */}
      {!imgError ? (
        <>
          {/* Hardware Photography */}
          <img
            src={category.image}
            alt={category.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out z-0"
            onError={() => setImgError(true)}
            loading="lazy"
          />

          {/* Controlled Dark Gradient Overlay for Maximum Text Contrast */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/55 to-transparent z-1 pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-tr from-accent-blue/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-1 pointer-events-none" />

          {/* Item Count Badge */}
          <div className="relative z-10 p-4 flex justify-between items-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-md font-mono text-[10px] sm:text-xs text-accent-blue font-bold tracking-wider shadow-md">
              <Icon name={iconName} size={14} />
              {category.itemCount} ITEMS
            </span>
          </div>

          {/* Bottom Headline & Price */}
          <div className="relative z-10 mt-auto p-5">
            <h3
              className={`text-white font-bold tracking-tight font-sans drop-shadow-md transition-colors group-hover:text-accent-blue ${
                featured ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg sm:text-xl'
              }`}
            >
              {category.title}
            </h3>

            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-xs sm:text-sm text-[#e2e8f0] font-semibold drop-shadow">
                {category.startingPrice ? `Starting at $${category.startingPrice}` : 'Explore Lineup'}
              </span>

              {/* Circular CTA Button */}
              <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-accent-blue hover:bg-[#0066d6] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1.5 shadow-lg shrink-0">
                <Icon name="arrow_forward" size={16} />
              </span>
            </div>
          </div>
        </>
      ) : (
        /* ── Non-Image Fallback Card Layout ── */
        <div className="relative z-10 flex flex-col justify-between h-full p-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
              <Icon name={iconName} size={24} />
            </div>
            <span className="font-mono text-[10px] text-accent-blue font-bold bg-accent-blue/10 px-2.5 py-1 rounded-md">
              {category.itemCount} ITEMS
            </span>
          </div>

          <div className="mt-auto">
            <h3 className="category-non-img-title font-bold text-lg sm:text-xl text-white tracking-tight group-hover:text-accent-blue transition-colors">
              {category.title}
            </h3>
            <div className="flex items-center justify-between mt-1.5">
              <span className="category-non-img-price font-mono text-xs text-outline">
                {category.startingPrice ? `Starting at $${category.startingPrice}` : 'Explore Lineup'}
              </span>
              <span className="w-9 h-9 rounded-full bg-accent-blue text-white flex items-center justify-center transition-transform group-hover:translate-x-1 shrink-0">
                <Icon name="arrow_forward" size={14} />
              </span>
            </div>
          </div>
        </div>
      )}
    </Link>
  )
}

export function CategorySection({ categories }: CategorySectionProps) {
  const featuredIds = ['gaming-pcs', 'gpus']

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-pulse" />
            <span className="font-mono text-xs text-accent-blue font-bold tracking-widest uppercase">
              HARDWARE SECTIONS
            </span>
          </div>
          <h2 className="text-white font-black text-2xl md:text-3xl tracking-tight">
            Explore Hardware Categories
          </h2>
        </div>
        <Link
          to="/categories"
          className="font-mono text-xs tracking-wider text-accent-blue hover:text-[#adc6ff] transition-colors flex items-center gap-1.5 font-bold shrink-0"
        >
          <span>ALL CATEGORIES</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Bento Grid Composition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {categories.map((cat) => (
          <CategoryTile key={cat.id} category={cat} featured={featuredIds.includes(cat.id)} />
        ))}
      </div>
    </section>
  )
}
