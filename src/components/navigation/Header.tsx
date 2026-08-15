import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '../ui'
import { navCategories, searchProducts, allBrandNames, categoryDetails } from '../../data'
import type { NavCategory } from '../../types'
import { useShop } from '../../context/ShopContext'

// ─── MegaMenu Dropdown ────────────────────────────────────────────────────────

interface MegaMenuProps {
  category: NavCategory
  isOpen: boolean
  onClose: () => void
}

function MegaMenu({ category, isOpen, onClose }: MegaMenuProps) {
  if (!category.columns || !isOpen) return null

  return (
    <div
      className="absolute top-full left-0 right-0 z-[100] bg-[#16171d] border-b border-[#292a2e] shadow-2xl transition-all duration-150 animate-fadeIn"
      onMouseLeave={onClose}
    >
      <div className="container-max px-6 py-6">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#292a2e]">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold tracking-tight text-base uppercase">{category.label}</span>
            <span className="font-mono text-[10px] text-[#007aff] bg-[#007aff15] px-2 py-0.5 rounded border border-[#007aff30] font-bold">
              HARDWARE CATALOG
            </span>
          </div>
          <Link
            to={category.href}
            onClick={onClose}
            className="font-mono text-xs text-[#adc6ff] hover:text-white flex items-center gap-1 transition-colors font-medium"
          >
            VIEW ALL {category.label.toUpperCase()} <Icon name="arrow_forward" size={14} />
          </Link>
        </div>

        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: `repeat(${category.columns.length}, minmax(0, 1fr))` }}
        >
          {category.columns.map((col, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="font-mono text-[10px] tracking-wider text-[#8b90a0] mb-3 uppercase font-bold border-l-2 border-[#007aff] pl-2">
                {col.title}
              </div>
              <ul className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className="text-xs text-[#c1c6d7] hover:text-white hover:translate-x-1 transition-all duration-150 flex items-center justify-between group py-1"
                    >
                      <span className="group-hover:text-white font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="font-mono text-[9px] bg-[#ff5c00] text-white px-1.5 py-0.2 rounded font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

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
  placeholder = 'Search products, categories, or brands',
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
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSearch}
        className="header-search-container relative flex items-center bg-[#18191e] rounded-md border border-[#292a2e] focus-within:border-[#007aff] transition-all shadow-inner"
      >
        <button
          type="submit"
          aria-label="Search"
          className="text-[#8b90a0] hover:text-white ml-3.5 shrink-0 transition-colors"
        >
          <Icon name="search" size={18} />
        </button>
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
          className="w-full bg-transparent border-none text-[#e3e2e7] text-xs font-sans py-2.5 px-3 focus:outline-none placeholder:text-[#8b90a0]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setOpen(true)
            }}
            className="mr-3 text-[#8b90a0] hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#16171d] border border-[#292a2e] rounded-md shadow-2xl z-[120] max-h-[70vh] overflow-y-auto animate-fadeIn">
          {q && hasResults && (
            <div className="p-2">
              {productMatches.length > 0 && (
                <div className="mb-2">
                  <span className="font-mono text-[10px] text-[#8b90a0] uppercase px-2 py-1 block font-semibold">
                    Products
                  </span>
                  {productMatches.map((p) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      onClick={() => commit(p.name)}
                      className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#1e1f23] transition-colors"
                    >
                      <img src={p.image} alt="" className="w-9 h-9 object-cover rounded bg-[#0d0e12] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-white text-xs font-medium truncate block">{p.name}</span>
                        <span className="font-mono text-[10px] text-[#8b90a0]">{p.brand}</span>
                      </div>
                      <span className="font-mono text-xs text-[#007aff] font-bold shrink-0">
                        ${p.price.toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {brandMatches.length > 0 && (
                <div className="border-t border-[#292a2e] pt-2 mb-1">
                  <span className="font-mono text-[10px] text-[#8b90a0] uppercase px-2 py-1 block font-semibold">
                    Brands
                  </span>
                  <div className="flex flex-wrap gap-1.5 px-2 py-1">
                    {brandMatches.map((b) => (
                      <Link
                        key={b}
                        to={`/products?brand=${encodeURIComponent(b)}`}
                        onClick={() => setOpen(false)}
                        className="text-[11px] font-mono text-[#c1c6d7] hover:text-white bg-[#121317] border border-[#292a2e] hover:border-[#007aff] px-2.5 py-1 rounded transition-colors"
                      >
                        {b}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {categoryMatches.length > 0 && (
                <div className="border-t border-[#292a2e] pt-2">
                  <span className="font-mono text-[10px] text-[#8b90a0] uppercase px-2 py-1 block font-semibold">
                    Categories
                  </span>
                  {categoryMatches.map((c) => (
                    <Link
                      key={c.id}
                      to={`/category/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1e1f23] text-xs text-[#c1c6d7] hover:text-white transition-colors"
                    >
                      <Icon name="category" size={14} className="text-[#8b90a0]" /> {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {q && !hasResults && (
            <div className="px-4 py-6 text-center text-xs font-mono text-[#8b90a0]">
              No matches for "{query}". Press Enter to search hardware catalog.
            </div>
          )}

          {!q && (
            <div className="p-3 space-y-3">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-semibold">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecent}
                      className="font-mono text-[10px] text-[#8b90a0] hover:text-[#ff453a] transition-colors"
                    >
                      CLEAR
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => commit(r)}
                        className="flex items-center gap-1 text-[11px] text-[#c1c6d7] hover:text-white bg-[#121317] border border-[#292a2e] hover:border-[#414755] px-2.5 py-1 rounded transition-colors"
                      >
                        <Icon name="history" size={12} className="text-[#8b90a0]" /> {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="font-mono text-[10px] text-[#8b90a0] uppercase px-1 mb-1.5 block font-semibold">
                  Popular Searches
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((p) => (
                    <button
                      key={p}
                      onClick={() => commit(p)}
                      className="flex items-center gap-1 text-[11px] text-[#adc6ff] hover:text-white bg-[#007aff10] border border-[#007aff30] hover:border-[#007aff] px-2.5 py-1 rounded transition-colors"
                    >
                      <Icon name="trending_up" size={12} /> {p}
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

// ─── Account Dropdown Menu ────────────────────────────────────────────────────

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
        className="flex items-center gap-2 text-[#e3e2e7] hover:text-[#adc6ff] px-2.5 py-2 rounded transition-colors"
        aria-label="My Account"
      >
        <Icon name="person" size={22} className="text-[#adc6ff]" />
        <div className="hidden xl:flex flex-col items-start leading-none">
          <span className="font-mono text-[9px] text-[#8b90a0] uppercase tracking-wider">WELCOME</span>
          <span className="text-xs font-semibold text-white mt-0.5 flex items-center gap-0.5">
            Account <Icon name="expand_more" size={14} className="text-[#8b90a0]" />
          </span>
        </div>
      </Link>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[#16171d] border border-[#292a2e] rounded-md shadow-2xl py-2 z-[130] animate-fadeIn">
          <div className="px-4 py-2.5 border-b border-[#292a2e]">
            <span className="text-white font-bold text-xs block">Alexandre Vance</span>
            <span className="font-mono text-[10px] text-[#30d158] font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" /> VIP Member
            </span>
          </div>

          <div className="py-1 border-b border-[#292a2e]">
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
            >
              <Icon name="dashboard" size={16} className="text-[#8b90a0]" /> Dashboard
            </Link>
            <Link
              to="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
            >
              <Icon name="package_2" size={16} className="text-[#8b90a0]" /> Order History
            </Link>
            <Link
              to="/track-order"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
            >
              <Icon name="local_shipping" size={16} className="text-[#007aff]" /> Live Order Tracking
            </Link>
            <Link
              to="/account/addresses"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
            >
              <Icon name="home_pin" size={16} className="text-[#8b90a0]" /> Saved Addresses
            </Link>
            <Link
              to="/account/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
            >
              <Icon name="settings" size={16} className="text-[#8b90a0]" /> Account Settings
            </Link>
          </div>

          <div className="py-1">
            <Link
              to="/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
            >
              <Icon name="support_agent" size={16} className="text-[#8b90a0]" /> Customer Support &amp; RMA
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#ff453a] hover:bg-[#1a1b1f] transition-colors font-mono font-semibold"
            >
              <Icon name="logout" size={16} /> Sign Out
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Category Navigation (Row 2 Desktop) ─────────────────────────────────

interface CategoryNavProps {
  openMegaMenu: string | null
  setOpenMegaMenu: (id: string | null) => void
}

// Primary visible categories on row 2 desktop (clean, generous spacing)
const PRIMARY_NAV = navCategories.slice(0, 10)
const MORE_NAV = navCategories.slice(10)

export function CategoryNavigation({ openMegaMenu, setOpenMegaMenu }: CategoryNavProps) {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="hidden md:flex items-center justify-between gap-6 py-2.5 font-mono text-xs tracking-wider border-t border-[#1e1f23]">
      <div className="flex items-center gap-6 xl:gap-8 flex-wrap">
        {PRIMARY_NAV.map((cat) => {
          const isActive =
            location.pathname === cat.href || (cat.href !== '/' && location.pathname.startsWith(cat.href))
          const isOpen = openMegaMenu === cat.href

          return (
            <div
              key={cat.href}
              className="relative"
              onMouseEnter={() => (cat.columns ? setOpenMegaMenu(cat.href) : setOpenMegaMenu(null))}
            >
              <Link
                to={cat.href}
                className={`flex items-center gap-1 py-1 font-semibold transition-colors duration-150 ${
                  isOpen || isActive
                    ? 'text-[#007aff] border-b-2 border-[#007aff]'
                    : cat.label === 'Deals'
                    ? 'text-[#ff5c00] hover:text-[#ffb59a]'
                    : 'text-[#c1c6d7] hover:text-white'
                }`}
              >
                {cat.label}
                {cat.columns && <Icon name="expand_more" size={14} className="text-[#8b90a0]" />}
              </Link>
            </div>
          )
        })}

        {/* More Categories Dropdown */}
        {MORE_NAV.length > 0 && (
          <div
            ref={moreRef}
            className="relative"
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 py-1 font-semibold text-[#8b90a0] hover:text-white transition-colors"
            >
              More <Icon name="expand_more" size={14} />
            </button>

            {moreOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-[#16171d] border border-[#292a2e] rounded-md shadow-2xl py-2 z-[110] animate-fadeIn">
                {MORE_NAV.map((cat) => (
                  <Link
                    key={cat.href}
                    to={cat.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-xs font-mono text-[#c1c6d7] hover:text-white hover:bg-[#1a1b1f] transition-colors"
                  >
                    <span>{cat.label}</span>
                    <Icon name="chevron_right" size={14} className="text-[#414755]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Special Deals Pill Link */}
      <Link
        to="/deals"
        className="font-mono text-[11px] text-[#ff5c00] hover:text-white font-bold flex items-center gap-1 bg-[#ff5c0010] border border-[#ff5c0030] px-3 py-1 rounded transition-colors"
      >
        <Icon name="bolt" size={14} /> FLASH DEALS
      </Link>
    </nav>
  )
}

// ─── Header Component ─────────────────────────────────────────────────────────

export function Header() {
  const { cartCount, wishlistCount, compareCount, theme, toggleTheme } = useShop()
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const location = useLocation()

  const activeCategory = navCategories.find((c) => c.href === openMegaMenu)

  // Close menus on navigation
  useEffect(() => {
    setOpenMegaMenu(null)
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMegaMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 bg-[#121317] border-b border-[#292a2e] select-none shadow-xl"
      onMouseLeave={() => setOpenMegaMenu(null)}
    >
      <div className="container-max px-4 md:px-8">
        {/* ROW 1 — MAIN ECOMMERCE HEADER (Spacious, ~80px) */}
        <div className="flex items-center justify-between py-4 md:py-5 gap-6">
          {/* Mobile: Hamburger Toggle */}
          <button
            className="md:hidden text-[#c1c6d7] hover:text-white transition-colors p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 font-black text-xl md:text-2xl text-white tracking-tighter hover:text-[#adc6ff] transition-colors"
          >
            <span className="w-3 h-6 bg-[#007aff] rounded-sm inline-block shrink-0" />
            <span>PREMIUM PC</span>
          </Link>

          {/* Center Search Bar (Desktop 400-550px wide main focus) */}
          <div className="flex-1 max-w-[520px] hidden md:block">
            <SearchBar placeholder="Search products, categories, or brands" />
          </div>

          {/* Right Primary Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Search Icon */}
            <button
              className="md:hidden text-[#c1c6d7] hover:text-white transition-colors p-1.5"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle search"
            >
              <Icon name="search" size={22} />
            </button>

            {/* PC Builder Button */}
            <Link
              to="/builder"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 border border-[#007aff60] text-[#007aff] hover:bg-[#007aff15] rounded font-mono text-xs tracking-wider transition-colors font-bold shrink-0"
            >
              <Icon name="memory" size={16} />
              PC BUILDER
            </Link>

            {/* Compare Badge Indicator (Compact, shown only when > 0) */}
            {compareCount > 0 && (
              <Link
                to="/compare"
                className="hidden lg:flex items-center gap-1 bg-[#007aff15] border border-[#007aff40] text-[#007aff] px-2.5 py-1.5 rounded font-mono text-xs font-bold transition-colors"
                title="View compared products"
              >
                <Icon name="balance" size={16} />
                <span>{compareCount}</span>
              </Link>
            )}

            {/* Account Menu */}
            <div className="hidden sm:block">
              <AccountMenu />
            </div>

            {/* Theme Mode Toggle (Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex items-center justify-center p-2 text-[#c1c6d7] hover:text-[#007aff] transition-colors rounded hover:bg-[#1a1b1f] border border-transparent hover:border-[#292a2e]"
            >
              <Icon
                name={theme === 'dark' ? 'light_mode' : 'dark_mode'}
                size={20}
                className={theme === 'dark' ? 'text-[#ffd60a]' : 'text-[#007aff]'}
              />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="flex items-center justify-center p-2 text-[#c1c6d7] hover:text-white transition-colors relative"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Icon name="favorite" size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#ff453a] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 py-2 bg-[#1a1b1f] hover:bg-[#23242a] text-white border border-[#292a2e] rounded transition-colors relative"
              aria-label={`Cart (${cartCount} items)`}
            >
              <div className="relative">
                <Icon name="shopping_cart" size={20} className="text-[#007aff]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#007aff] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline font-mono text-xs font-bold tracking-wider">Cart</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Overlay Input */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3">
            <SearchBar placeholder="Search products, categories, or brands" onSearchSubmit={() => setMobileSearchOpen(false)} />
          </div>
        )}

        {/* ROW 2 — CATEGORY NAVIGATION (Desktop) */}
        <CategoryNavigation openMegaMenu={openMegaMenu} setOpenMegaMenu={setOpenMegaMenu} />

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#292a2e] py-4 bg-[#121317] max-h-[85vh] overflow-y-auto">
            <div className="mb-4 px-2">
              <Link
                to="/builder"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs rounded tracking-wider font-bold shadow-lg"
              >
                <Icon name="build" size={16} />
                CUSTOM PC BUILDER
              </Link>
            </div>

            <span className="font-mono text-[10px] text-[#8b90a0] uppercase px-2 font-bold block mb-2">
              PRODUCT CATEGORIES
            </span>

            <nav className="flex flex-col mb-6">
              {navCategories.map((cat) => (
                <div key={cat.href} className="border-b border-[#1e1f23]">
                  <Link
                    to={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-3 px-2 font-mono text-xs tracking-wider transition-colors ${
                      cat.label === 'Deals' ? 'text-[#ff5c00] font-bold' : 'text-[#c1c6d7] hover:text-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <Icon name="chevron_right" size={16} className="text-[#414755]" />
                  </Link>
                </div>
              ))}
            </nav>

            {/* Mobile Account & Support Section */}
            <span className="font-mono text-[10px] text-[#8b90a0] uppercase px-2 font-bold block mb-2">
              MY ACCOUNT &amp; HELP
            </span>
            <div className="flex flex-col gap-1 px-2 font-mono text-xs text-[#c1c6d7]">
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 flex items-center gap-2 hover:text-white"
              >
                <Icon name="person" size={16} className="text-[#8b90a0]" /> My Account
              </Link>
              <Link
                to="/account/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 flex items-center gap-2 hover:text-white"
              >
                <Icon name="package_2" size={16} className="text-[#8b90a0]" /> Order History
              </Link>
              <Link
                to="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 flex items-center gap-2 hover:text-white"
              >
                <Icon name="local_shipping" size={16} className="text-[#007aff]" /> Live Order Tracking
              </Link>
              <Link
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 flex items-center gap-2 hover:text-white"
              >
                <Icon name="support_agent" size={16} className="text-[#8b90a0]" /> Customer Support &amp; RMA
              </Link>
              <Link
                to="/b2b"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 flex items-center gap-2 hover:text-white"
              >
                <Icon name="business" size={16} className="text-[#8b90a0]" /> B2B Portal
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mega Menu Dropdown Overlay */}
      {activeCategory && openMegaMenu && (
        <MegaMenu category={activeCategory} isOpen={!!openMegaMenu} onClose={() => setOpenMegaMenu(null)} />
      )}
    </header>
  )
}
