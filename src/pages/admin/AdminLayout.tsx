import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { useShop } from '../../context/ShopContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/products', label: 'Products', icon: 'inventory_2', end: false },
  { to: '/admin/categories', label: 'Categories', icon: 'category', end: false },
  { to: '/admin/brands', label: 'Brands', icon: 'add_business', end: false },
  { to: '/admin/promotions', label: 'Deals', icon: 'sell', end: false },
  { to: '/admin/hero', label: 'Homepage Hero', icon: 'campaign', end: false },
  { to: '/admin/gaming-pcs', label: 'Gaming PCs', icon: 'memory', end: false },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long', end: false },
  { to: '/admin/customers', label: 'Customers', icon: 'group', end: false },
  { to: '/admin/media', label: 'Media Library', icon: 'perm_media', end: false },
  { to: '/admin/settings', label: 'Store Settings', icon: 'settings', end: false },
]

function AdminAuthGate() {
  const { loginAsAdmin } = useShop()
  const [email, setEmail] = useState('admin@premiumpc.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await loginAsAdmin(password, email)
    if (!success) {
      setError(true)
    }
  }

  const fieldClass = 'w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] placeholder:text-[var(--text-muted)] transition-colors'
  const labelClass = 'text-xs font-semibold text-[var(--text-secondary)] block mb-1.5'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 flex items-center justify-center text-[var(--accent-blue)] mb-3">
            <Icon name="admin_panel_settings" size={28} />
          </div>
          <span className="font-bold text-xl text-[var(--text-primary)] tracking-tight">PREMIUM PC</span>
          <span className="text-xs text-[var(--accent-blue)] font-mono font-bold uppercase tracking-wider mt-1">Admin Console</span>
          <p className="text-[var(--text-secondary)] text-xs mt-2 max-w-xs leading-relaxed">
            Authenticate with store administrator credentials to manage products, orders, and system settings.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 text-xs font-mono flex items-center gap-2">
            <Icon name="error" size={16} /> Invalid administrator credentials. Check email and password.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Admin Email</label>
            <input
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@premiumpc.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Admin Password</label>
            </div>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon name="lock" size={16} />
            <span>UNLOCK ADMIN CONSOLE</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
          <Link to="/" className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1">
            <Icon name="arrow_back" size={14} /> Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { isAdminLoggedIn, logoutAdmin } = useShop()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAdminLoggedIn) {
    return <AdminAuthGate />
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/')
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-[var(--bg-surface-secondary)] border-r border-[var(--border-subtle)]">
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <Link to="/admin" className="flex flex-col leading-none">
          <span className="font-black text-lg text-[var(--text-primary)] tracking-tighter">PREMIUM PC</span>
          <span className="font-mono text-[9px] text-[var(--accent-blue)] font-bold tracking-[0.2em] mt-0.5">ADMIN CONSOLE</span>
        </Link>
        <button
          className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-xs font-bold transition-colors ${
                isActive ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              }`
            }
          >
            <Icon name={item.icon} size={18} />
            <span className="uppercase tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
        >
          <Icon name="storefront" size={18} />
          <span className="uppercase">View Store</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <Icon name="logout" size={18} />
          <span className="uppercase">Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">{sidebar}</div>
          <div className="flex-1 bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-[var(--bg-surface-secondary)] border-b border-[var(--border-subtle)] px-4 md:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={22} />
          </button>
          <div className="relative flex items-center bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 max-w-md flex-1">
            <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
            <input
              placeholder="Search orders, products, customers..."
              className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="lock" size={14} />
              <span>LOCK CONSOLE</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ─── Shared admin UI ─────────────────────────────────────────────────────────────

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-[var(--text-primary)] font-bold text-xl md:text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-[var(--text-secondary)] text-xs mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  delta,
  deltaUp,
  icon,
  color = 'var(--accent-blue)',
}: {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  icon: string
  color?: string
}) {
  return (
    <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] p-4 rounded-xl">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, color }}
        >
          <Icon name={icon} size={18} />
        </div>
        {delta && (
          <span
            className={`font-mono text-xs font-bold flex items-center gap-0.5 ${
              deltaUp ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            <Icon name={deltaUp ? 'trending_up' : 'trending_down'} size={13} /> {delta}
          </span>
        )}
      </div>
      <div className="text-[var(--text-primary)] font-bold text-2xl mt-3 tracking-tight">{value}</div>
      <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase mt-1 tracking-wider">{label}</div>
    </div>
  )
}

export function Pill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Shipped: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
    Processing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Refunded: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    VIP: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    Inactive: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--border-subtle)]',
    'in-stock': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'low-stock': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'out-of-stock': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Scheduled: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
    Expired: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--border-subtle)]',
  }
  const label = status.replace('-', ' ').toUpperCase()
  return (
    <span
      className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold border whitespace-nowrap ${
        map[status] || 'bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
      }`}
    >
      {label}
    </span>
  )
}
