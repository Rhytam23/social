import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // Track window scroll position for header glass transition
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Menu', path: '/menu' },
    { label: 'Contact', path: '/contact' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled
          ? 'bg-(--bg-surface)/95 backdrop-blur-md border-b border-(--border-theme) shadow-xs py-0'
          : 'bg-(--bg-primary)/80 backdrop-blur-xs border-b border-transparent py-1'
      }`}
    >
      <div className="container-max px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-(--accent-green) text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Icon name="coffee" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg md:text-xl tracking-tight text-(--text-primary) group-hover:text-(--accent-green) transition-colors duration-200">
              [CAFÉ NAME]
            </span>
            <span className="text-[10px] text-(--text-muted) tracking-widest uppercase font-medium -mt-1">
              Coffee & Kitchen
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`
                px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 active:scale-[0.98]
                ${
                  isActive(link.path)
                    ? 'bg-(--accent-green) text-white shadow-xs'
                    : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary)'
                }
              `}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <Link
            to="/menu"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-(--accent-blue) text-white text-xs font-semibold hover:bg-(--accent-blue-hover) transition-all duration-200 shadow-xs hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>View Menu</span>
            <Icon name="arrow_forward" size={14} />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-(--text-primary) hover:bg-(--bg-surface-secondary) transition-colors active:scale-95 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-(--border-theme) bg-(--bg-surface) px-4 py-6 space-y-4 animate-fadeIn">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link, idx) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  animationDelay: `${idx * 50}ms`,
                }}
                className={`
                  px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-between animate-fadeIn active:scale-[0.99]
                  ${
                    isActive(link.path)
                      ? 'bg-(--accent-green) text-white'
                      : 'text-(--text-primary) hover:bg-(--bg-surface-secondary)'
                  }
                `}
              >
                <span>{link.label}</span>
                <Icon name="chevron_right" size={18} />
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-(--border-subtle) space-y-2">
            <Link
              to="/contact"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-(--bg-surface-secondary) text-(--text-primary) text-xs font-semibold border border-(--border-theme) hover:border-(--accent-green) transition-colors"
            >
              <Icon name="location_on" size={16} className="text-(--accent-green)" />
              <span>[ADDRESS]</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
