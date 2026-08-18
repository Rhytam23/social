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

function CategoryTile({ category }: { category: CategoryCard }) {
  const [imgError, setImgError] = useState(false)
  const iconName = CATEGORY_ICONS[category.id] || 'hardware'

  return (
    <Link
      to={category.href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-[var(--bg-surface)] border border-[var(--border-theme)] hover:border-[var(--accent-blue)] transition-all p-5 min-h-[160px]"
    >
      {!imgError ? (
        <>
          <img
            src={category.image}
            alt={category.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 opacity-40 z-0"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-[var(--bg-surface)]/80 to-transparent z-1" />

          <div className="relative z-10 flex justify-between items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-md text-xs font-semibold text-[var(--accent-blue)]">
              <Icon name={iconName} size={14} />
              <span>{category.itemCount} items</span>
            </span>
          </div>

          <div className="relative z-10 mt-auto pt-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              {category.title}
            </h3>
            {category.startingPrice && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                From ${category.startingPrice}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] flex items-center justify-center text-[var(--accent-blue)] mb-4">
            <Icon name={iconName} size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              {category.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              {category.itemCount} products
            </p>
          </div>
        </div>
      )}
    </Link>
  )
}

export function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-[var(--text-primary)] font-bold text-xl tracking-tight">Browse by Category</h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-0.5">Explore component categories and pre-built systems</p>
        </div>
        <Link to="/categories" className="text-xs font-semibold text-[var(--accent-blue)] hover:underline flex items-center gap-1">
          <span>All Categories</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.slice(0, 8).map((cat) => (
          <CategoryTile key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  )
}
