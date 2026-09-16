import { useState } from 'react'
import { Icon } from '../components/ui'
import { MenuCard } from '../components/menu/MenuCard'
import { CAFÉ_MENU_ITEMS, MENU_CATEGORIES } from '../data/menuData'
import { FadeUp } from '../components/motion/MotionPrimitives'

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  const filteredItems = activeCategory === 'all'
    ? CAFÉ_MENU_ITEMS
    : CAFÉ_MENU_ITEMS.filter((item) => item.category === activeCategory)

  const handleCategoryChange = (catId: string) => {
    if (catId === activeCategory) return
    setIsTransitioning(true)
    setActiveCategory(catId)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 150)
  }

  return (
    <main className="flex-1 bg-(--bg-primary) text-(--text-primary)">
      
      {/* ─── Menu Header ─── */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-(--bg-surface-secondary) border-b border-(--border-theme)">
        <div className="container-max max-w-4xl mx-auto text-center space-y-4">
          <FadeUp delay={100}>
            <span className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
              Our Offerings
            </span>
          </FadeUp>
          <FadeUp delay={200}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-(--text-primary)">
              Café Menu
            </h1>
          </FadeUp>
          <FadeUp delay={300}>
            <p className="text-xs sm:text-sm md:text-base text-(--text-secondary) max-w-xl mx-auto">
              Discover our freshly prepared food and beverage options, crafted daily with quality ingredients.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ─── Menu Items & Category Tabs ─── */}
      <section className="py-10 md:py-16 px-4 md:px-6">
        <div className="container-max space-y-8">
          
          {/* Category Filter Tabs */}
          <FadeUp delay={400}>
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`
                    px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95
                    ${
                      activeCategory === cat.id
                        ? 'bg-(--accent-green) text-white shadow-xs'
                        : 'bg-(--bg-surface) text-(--text-secondary) border border-(--border-theme) hover:border-(--accent-green) hover:text-(--text-primary)'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </FadeUp>

          {/* Menu Items Grid with Crossfade Transition */}
          <div
            className={`transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isTransitioning ? 'opacity-40 scale-[0.995]' : 'opacity-100 scale-100'
            }`}
          >
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <MenuCard item={item} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-(--bg-surface) border border-(--border-theme) rounded-2xl p-8 space-y-3">
                <Icon name="restaurant_menu" size={36} className="text-(--text-muted) mx-auto" />
                <h3 className="font-bold text-base text-(--text-primary)">No menu items found</h3>
                <p className="text-xs text-(--text-secondary)">Try selecting another category above.</p>
              </div>
            )}
          </div>

        </div>
      </section>

    </main>
  )
}
