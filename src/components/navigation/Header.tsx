import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '../ui'
import { searchProducts, allBrandNames, categoryDetails } from '../../data'
import { useShop } from '../../context/ShopContext'

// ─── SearchBar Component ──────────────────────────────────────────────────────

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearchSubmit?: () => void
}

const POPULAR_SEARCHES = ['RTX 5090', 'Ryzen 7 7800X3D', 'DDR5-6000', 'OLED Monitor', 'PCIe 5.0 SSD', 'ATX 3.0 PSU']

function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem('premium_pc_recent_searches')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function SearchBar({
  placeholder = 'Search products, categories, or brands...',
  className = '',
  onSearchSubmit,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const q = query.trim().toLowerCase()
  const productMatches = q ? searchProducts(q).slice(0, 5) : []
  const brandMatches = q ? allBrandNames.filter((b) => b.toLowerCase().includes(q)).slice(0, 4) : []
  const categoryMatches = q ? categoryDetails.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4) : []

  function commit(term: string) {
    const t = term.trim()
    if (!t) return
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6)
    setRecent(next)
    try {
      localStorage.setItem('premium_pc_recent_searches', JSON.stringify(next))
    } catch {
      /* ignore */
    }
    navigate(`/search?q=${encodeURIComponent(t)}`)
    setOpen(false)
    if (onSearchSubmit) onSearchSubmit()
  }

  function clearRecent() {
    setRecent([])
    try {
      localStorage.removeItem('premium_pc_recent_searches')
    } catch {
      /* ignore */
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    commit(query)
  }

  const showDropdown = open
  const hasResults = productMatches.length || brandMatches.length || categoryMatches.length

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSearch}
        className="relative flex items-center w-full bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme) focus-within:border-(--accent-blue) transition-all overflow-hidden animate-none"
      >
        <span className="pl-3.5 text-(--text-secondary) flex items-center justify-center shrink-0">
          <Icon name="search" size={18} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Search products, categories, or brands"
          className="w-full bg-transparent text-(--text-primary) text-xs py-2 px-2.5 focus:outline-none placeholder:text-(--text-muted)"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setOpen(true)
            }}
            className="px-3 text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-(--bg-surface) border border-(--border-theme) rounded-xl shadow-2xl z-[120] max-h-[70vh] overflow-y-auto">
          {q && hasResults && (
            <div className="p-3 space-y-3">
              {productMatches.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider block px-2 mb-1.5">
                    Products
                  </span>
                  {productMatches.map((p) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      onClick={() => commit(p.name)}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-(--bg-surface-secondary) transition-all"
                    >
                      <img src={p.image} alt="" className="w-8 h-8 object-cover rounded bg-(--bg-surface-secondary) shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-(--text-primary) text-xs font-medium truncate block">{p.name}</span>
                        <span className="text-[10px] text-(--text-muted)">{p.brand}</span>
                      </div>
                      <span className="text-xs text-(--accent-blue) font-bold shrink-0">
                        ${p.price.toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {brandMatches.length > 0 && (
                <div className="border-t border-(--border-theme) pt-2">
                  <span className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider block px-2 mb-1.5">
                    Brands
                  </span>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {brandMatches.map((b) => (
                      <Link
                        key={b}
                        to={`/products?brand=${encodeURIComponent(b)}`}
                        onClick={() => setOpen(false)}
                        className="text-xs text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-surface-secondary) border border-(--border-theme) hover:border-(--accent-blue) px-2.5 py-1 rounded-md transition-all"
                      >
                        {b}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {q && !hasResults && (
            <div className="px-4 py-6 text-center text-xs text-(--text-muted)">
              No matches for "{query}". Press Enter to search catalog.
            </div>
          )}

          {!q && (
            <div className="p-3 space-y-3">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <span className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecent}
                      className="text-[10px] text-(--text-muted) hover:text-rose-500 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => commit(r)}
                        className="flex items-center gap-1 text-xs text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-surface-secondary) border border-(--border-theme) px-2.5 py-1 rounded-md transition-all"
                      >
                        <Icon name="history" size={13} className="text-(--text-muted)" /> {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider px-1 mb-1.5 block">
                  Popular Searches
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((p) => (
                    <button
                      key={p}
                      onClick={() => commit(p)}
                      className="flex items-center gap-1 text-xs text-(--accent-blue) hover:underline bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-1 rounded-md transition-all"
                    >
                      <Icon name="trending_up" size={13} /> {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Account Menu Component ───────────────────────────────────────────────────

function AccountMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link
        to="/account"
        onClick={() => setOpen(false)}
        className="flex items-center gap-1.5 text-(--text-secondary) hover:text-(--text-primary) text-xs font-medium py-1 px-2 rounded-lg hover:bg-(--bg-surface-secondary) transition-all"
        aria-label="My Account"
      >
        <Icon name="person" size={18} className="text-(--accent-blue)" />
        <span>Account</span>
        <Icon name="expand_more" size={14} className="text-(--text-muted)" />
      </Link>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-(--bg-surface) border border-(--border-theme) rounded-xl shadow-2xl py-2 z-[130]">
          <div className="px-4 py-2 border-b border-(--border-theme)">
            <span className="text-(--text-primary) font-bold text-xs block">Alexandre Vance</span>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> VIP Member
            </span>
          </div>

          <div className="py-1 border-b border-(--border-theme)">
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary) transition-all"
            >
              <Icon name="dashboard" size={15} className="text-(--text-muted)" /> Dashboard
            </Link>
            <Link
              to="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary) transition-all"
            >
              <Icon name="package_2" size={15} className="text-(--text-muted)" /> Order History
            </Link>
            <Link
              to="/track-order"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary) transition-all"
            >
              <Icon name="local_shipping" size={15} className="text-(--accent-blue)" /> Order Tracking
            </Link>
          </div>

          <div className="py-1">
            <Link
              to="/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary) transition-all"
            >
              <Icon name="support_agent" size={15} className="text-(--text-muted)" /> Help &amp; Support
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs text-rose-500 hover:bg-(--bg-surface-secondary) transition-all font-semibold"
            >
              <Icon name="logout" size={15} /> Sign Out
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mega Menu Dropdown ───────────────────────────────────────────────────────

function AllCategoriesMegaMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  const columns = [
    {
      title: 'Components',
      items: [
        { label: 'Graphics Cards', href: '/graphics-cards' },
        { label: 'CPUs & Processors', href: '/cpus' },
        { label: 'Motherboards', href: '/motherboards' },
        { label: 'RAM & Memory', href: '/ram' },
      ],
    },
    {
      title: 'Storage & Cooling',
      items: [
        { label: 'SSD & NVMe Storage', href: '/storage' },
        { label: 'CPU Liquid & Air Cooling', href: '/cooling' },
        { label: 'Power Supplies (PSU)', href: '/power-supplies' },
      ],
    },
    {
      title: 'PC Hardware',
      items: [
        { label: 'PC Cases & Chassis', href: '/cases' },
        { label: 'Accessories & Peripherals', href: '/peripherals' },
        { label: 'Gaming Prebuilts & PCs', href: '/gaming-pcs' },
      ],
    },
  ]

  return (
    <div
      className="absolute top-full left-0 z-[120] w-[640px] bg-(--bg-surface) border border-(--border-theme) rounded-b-xl shadow-2xl p-6 mt-0 animate-fadeIn"
      onMouseLeave={onClose}
    >
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-bold text-(--accent-blue) uppercase tracking-wider mb-3">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className="text-xs text-(--text-secondary) hover:text-(--text-primary) hover:translate-x-0.5 transition-all block py-0.5"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-3 border-t border-(--border-theme) flex items-center justify-between text-xs">
        <span className="text-(--text-secondary)">Explore the complete component line-up</span>
        <Link
          to="/products"
          onClick={onClose}
          className="text-(--accent-blue) font-semibold hover:underline flex items-center gap-1"
        >
          View Full Store Catalog <Icon name="arrow_forward" size={14} />
        </Link>
      </div>
    </div>
  )
}

function StoreNavigationBar() {
  const location = useLocation()
  const [megaOpen, setMegaOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const links = [
    { label: 'Gaming PCs', href: '/gaming-pcs' },
    { label: 'Components', href: '/components' },
    { label: 'Deals', href: '/deals', isDeals: true },
    { label: 'Support', href: '/support' },
  ]

  return (
    <div className="hidden md:block border-t border-(--border-theme) bg-(--bg-surface)">
      <div className="container-max px-4 md:px-6">
        <nav className="flex items-center gap-7 h-11 text-[13px]">
          {/* All Categories — text trigger, not a big button */}
          <div ref={menuRef} className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
            <button
              type="button"
              onClick={() => setMegaOpen(!megaOpen)}
              className={`flex items-center gap-1.5 font-semibold transition-colors ${
                megaOpen ? 'text-(--accent-blue)' : 'text-(--text-primary) hover:text-(--accent-blue)'
              }`}
            >
              <Icon name="menu" size={18} />
              <span>All Categories</span>
              <Icon name="expand_more" size={15} className="text-(--text-muted)" />
            </button>

            <AllCategoriesMegaMenu isOpen={megaOpen} onClose={() => setMegaOpen(false)} />
          </div>

          {/* Separator */}
          <span className="w-px h-4 bg-(--border-theme)" />

          {/* Navigation links */}
          {links.map((link) => {
            const isActive = location.pathname === link.href
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-(--accent-blue)'
                    : link.isDeals
                    ? 'text-[#ff6b00] hover:text-[#ff8533]'
                    : 'text-(--text-secondary) hover:text-(--text-primary)'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// ─── Main Header Component ─────────────────────────────────────────────────────

export function Header() {
  const { cartCount, wishlistCount, theme, toggleTheme } = useShop()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-50 bg-(--bg-surface) border-b border-(--border-theme) select-none shadow-sm">
      {/* ROW 1 — STORE HEADER (Top Bar) */}
      <div className="container-max px-4 md:px-6">
        <div className="flex items-center justify-between h-[72px] gap-4 md:gap-6">
          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-(--text-secondary) hover:text-(--text-primary) p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>

          {/* Premium PC Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="w-2.5 h-5 bg-(--accent-blue) rounded-xs shrink-0" />
            <span className="font-bold text-lg md:text-xl text-(--text-primary) tracking-tight group-hover:text-(--accent-blue) transition-colors">
              PREMIUM PC
            </span>
          </Link>

          {/* Search Bar (Dominant Center Element) */}
          <div className="hidden md:block flex-1 max-w-2xl mx-2">
            <SearchBar />
          </div>

          {/* Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Icon Toggle */}
            <button
              className="md:hidden text-(--text-secondary) hover:text-(--text-primary) p-1.5"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle search"
            >
              <Icon name="search" size={22} />
            </button>

            {/* PC Builder (Subtle Outlined CTA) */}
            <Link
              to="/builder"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 border border-(--border-theme) hover:border-(--accent-blue) text-(--text-primary) hover:text-(--accent-blue) bg-(--bg-surface-secondary) rounded-lg text-xs font-semibold transition-all"
            >
              <Icon name="memory" size={15} className="text-(--accent-blue)" />
              <span>PC Builder</span>
            </Link>



            {/* Account Menu */}
            <div className="hidden sm:block">
              <AccountMenu />
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex items-center justify-center p-2 text-(--text-secondary) hover:text-(--text-primary) rounded-lg hover:bg-(--bg-surface-secondary) transition-all"
            >
              <Icon
                name={theme === 'dark' ? 'light_mode' : 'dark_mode'}
                size={18}
                className={theme === 'dark' ? 'text-amber-400' : 'text-(--accent-blue)'}
              />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="flex items-center gap-1 p-2 text-(--text-secondary) hover:text-(--text-primary) transition-colors relative"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Icon name="favorite" size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 py-1.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
              aria-label={`Cart (${cartCount} items)`}
            >
              <div className="relative">
                <Icon name="shopping_cart" size={17} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-(--accent-blue) text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3">
            <SearchBar placeholder="Search products, categories, or brands..." onSearchSubmit={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* ROW 2 — STORE NAVIGATION BAR */}
      <StoreNavigationBar />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-(--border-theme) py-4 bg-(--bg-surface) max-h-[85vh] overflow-y-auto">
          <div className="mb-4 px-4">
            <Link
              to="/builder"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs rounded-lg font-semibold"
            >
              <Icon name="build" size={16} />
              <span>PC Builder</span>
            </Link>
          </div>

          <span className="text-xs font-semibold text-(--text-secondary) px-4 block mb-2">
            Navigation
          </span>

          <nav className="flex flex-col mb-4">
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-xs font-medium text-(--text-primary) border-b border-(--border-theme) flex items-center justify-between"
            >
              <span>All Products</span>
              <Icon name="chevron_right" size={16} className="text-(--text-muted)" />
            </Link>
            <Link
              to="/gaming-pcs"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-xs font-medium text-(--text-primary) border-b border-(--border-theme) flex items-center justify-between"
            >
              <span>Gaming PCs</span>
              <Icon name="chevron_right" size={16} className="text-(--text-muted)" />
            </Link>
            <Link
              to="/components"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-xs font-medium text-(--text-primary) border-b border-(--border-theme) flex items-center justify-between"
            >
              <span>Components</span>
              <Icon name="chevron_right" size={16} className="text-(--text-muted)" />
            </Link>
            <Link
              to="/deals"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-xs font-semibold text-[#ff6b00] border-b border-(--border-theme) flex items-center justify-between"
            >
              <span>Today's Deals</span>
              <Icon name="chevron_right" size={16} className="text-(--text-muted)" />
            </Link>
            <Link
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-xs font-medium text-(--text-primary) border-b border-(--border-theme) flex items-center justify-between"
            >
              <span>Support &amp; RMA</span>
              <Icon name="chevron_right" size={16} className="text-(--text-muted)" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
