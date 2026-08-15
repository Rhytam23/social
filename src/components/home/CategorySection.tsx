import { Link } from 'react-router-dom'
import type { CategoryCard } from '../../types'
import { Icon } from '../ui'

// ─── CategoryCard ─────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: CategoryCard
}

function CategoryCardItem({ category }: CategoryCardProps) {
  return (
    <Link
      to={category.href}
      className="group relative flex flex-col overflow-hidden rounded border border-[#414755] bg-[#1a1b1f] hover:border-[#007aff] transition-all duration-200"
      style={{ aspectRatio: '1/1' }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-[#1e1f23] group-hover:scale-105 transition-transform duration-300"
        style={{
          backgroundImage: `url('${category.image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121317] via-[#12131760] to-transparent" />

      {/* Content */}
      <div className="relative z-10 mt-auto p-3.5">
        <h3 className="text-white font-semibold text-sm tracking-tight group-hover:text-[#adc6ff] transition-colors line-clamp-1">{category.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[10px] text-[#8b90a0] tracking-[0.04em]">
            {category.itemCount} items
            {category.startingPrice && ` · from $${category.startingPrice}`}
          </span>
          <Icon name="arrow_forward" size={14} className="text-[#414755] group-hover:text-[#adc6ff] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

// ─── CategorySection ──────────────────────────────────────────────────────────

interface CategorySectionProps {
  categories: CategoryCard[]
}

export function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">Shop by Category</h2>
          <p className="text-[#8b90a0] text-xs mt-0.5">Explore our wide range of PC components and systems</p>
        </div>
        <Link
          to="/categories"
          className="font-mono text-xs tracking-[0.06em] text-[#adc6ff] hover:text-white transition-colors flex items-center gap-1 font-semibold"
        >
          ALL CATEGORIES <Icon name="chevron_right" size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <CategoryCardItem key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  )
}
