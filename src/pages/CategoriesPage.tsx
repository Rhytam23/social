import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { featuredCategories, navCategories } from '../data'

export function CategoriesPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-4">
          <Link to="/" className="hover:text-white">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">ALL CATEGORIES & DEPARTMENTS</span>
        </nav>

        <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Hardware Category Directory</h1>
        <p className="text-[#8b90a0] text-xs mb-8">
          Browse our full inventory across all component families, gaming rigs, and enthusiast peripherals.
        </p>

        {/* Featured Visual Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.href}
              className="group relative flex flex-col overflow-hidden rounded border border-[#414755] bg-[#1a1b1f] hover:border-[#007aff] transition-all duration-200 aspect-square"
            >
              <div
                className="absolute inset-0 bg-[#1e1f23] group-hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundImage: `url('${cat.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121317] via-[#12131760] to-transparent" />
              <div className="relative z-10 mt-auto p-3">
                <h3 className="text-white font-bold text-xs tracking-tight group-hover:text-[#adc6ff]">{cat.title}</h3>
                <span className="font-mono text-[9px] text-[#8b90a0] block">{cat.itemCount} Items</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Comprehensive Department Index */}
        <h2 className="text-white font-bold text-lg mb-6 border-b border-[#292a2e] pb-3">Complete Hardware Index</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navCategories.filter((c) => c.columns).map((category) => (
            <div key={category.label} className="p-5 bg-[#1a1b1f] border border-[#414755] rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#292a2e] pb-2">
                <Link to={category.href} className="text-white font-bold text-base hover:text-[#007aff] transition-colors">
                  {category.label}
                </Link>
                <Link to={category.href} className="text-xs font-mono text-[#adc6ff] hover:text-white flex items-center">
                  VIEW <Icon name="chevron_right" size={14} />
                </Link>
              </div>

              <div className="space-y-3">
                {category.columns?.map((col, idx) => (
                  <div key={idx}>
                    <span className="text-[10px] font-mono text-[#8b90a0] uppercase block font-semibold mb-1">{col.title}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {col.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="text-xs text-[#c1c6d7] hover:text-white bg-[#121317] border border-[#292a2e] hover:border-[#007aff] px-2.5 py-1 rounded transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
