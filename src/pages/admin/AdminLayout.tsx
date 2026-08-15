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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const success = loginAsAdmin(password)
    if (!success) {
      setError(true)
    }
  }

  const fillDemo = () => {
    setEmail('admin@premiumpc.com')
    setPassword('admin123')
    setError(false)
  }

  const fieldClass = 'w-full bg-[#121317] border border-[#414755] rounded p-3 text-xs text-white focus:outline-none focus:border-[#007aff] placeholder:text-[#8b90a0]'
  const labelClass = 'text-[11px] font-mono text-[#8b90a0] block mb-1.5 uppercase tracking-wider font-bold'

  return (
    <div className="min-h-screen bg-[#121317] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16171d] border border-[#414755] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#007aff]/15 border border-[#007aff]/40 flex items-center justify-center text-[#007aff] mb-3 shadow-[0_0_25px_rgba(0,122,255,0.2)]">
            <Icon name="admin_panel_settings" size={32} />
          </div>
          <span className="font-black text-xl text-white tracking-tighter">PREMIUM PC</span>
          <span className="font-mono text-[10px] text-[#007aff] tracking-[0.2em] uppercase mt-1">RESTRICTED ADMIN CONSOLE</span>
          <p className="text-[#8b90a0] text-xs mt-2 max-w-xs">
            Unauthorized access prohibited. Please authenticate with store administrator credentials.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#ff453a]/15 border border-[#ff453a]/40 rounded-lg text-[#ff453a] font-mono text-xs flex items-center gap-2">
            <Icon name="error" size={16} /> Invalid administrator password. Try &quot;admin123&quot;.
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
              <button
                type="button"
                onClick={fillDemo}
                className="font-mono text-[10px] text-[#007aff] hover:underline"
              >
                Auto-fill Demo Password
              </button>
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
            className="w-full py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Icon name="lock" size={16} />
            <span>UNLOCK ADMIN CONSOLE</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#292a2e] text-center">
          <Link to="/" className="font-mono text-xs text-[#8b90a0] hover:text-white flex items-center justify-center gap-1">
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
    <div className="flex flex-col h-full bg-[#0d0e12] border-r border-[#292a2e]">
      <div className="p-5 border-b border-[#292a2e] flex items-center justify-between">
        <Link to="/admin" className="flex flex-col leading-none">
          <span className="font-black text-lg text-white tracking-tighter">PREMIUM PC</span>
          <span className="font-mono text-[9px] text-[#007aff] tracking-[0.2em] mt-0.5">ADMIN CONSOLE</span>
        </Link>
        <button
          className="lg:hidden text-[#8b90a0] hover:text-white"
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
              `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs font-bold transition-colors ${
                isActive ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white hover:bg-[#1a1b1f]'
              }`
            }
          >
            <Icon name={item.icon} size={18} />
            <span className="uppercase tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#292a2e] space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded font-mono text-xs font-bold text-[#8b90a0] hover:text-white hover:bg-[#1a1b1f] transition-colors"
        >
          <Icon name="storefront" size={18} />
          <span className="uppercase">View Store</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded font-mono text-xs font-bold text-[#ff453a] hover:bg-[#ff453a]/15 transition-colors"
        >
          <Icon name="logout" size={18} />
          <span className="uppercase">Sign Out Admin</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-[#121317] text-[#e3e2e7]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">{sidebar}</div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-[#121317] border-b border-[#292a2e] px-4 md:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden text-[#c1c6d7] hover:text-white"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={22} />
          </button>
          <div className="relative flex items-center bg-[#1a1b1f] border border-[#414755] rounded px-3 py-1.5 max-w-md flex-1">
            <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
            <input
              placeholder="Search orders, products, customers..."
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-[#ff453a]/15 hover:bg-[#ff453a] text-[#ff453a] hover:text-white font-mono text-[11px] font-bold rounded transition-colors flex items-center gap-1.5"
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
        <h1 className="text-white font-bold text-xl md:text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-[#8b90a0] text-xs mt-1">{subtitle}</p>}
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
  color = '#007aff',
}: {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  icon: string
  color?: string
}) {
  return (
    <div className="bg-[#1a1b1f] border border-[#414755] rounded p-4">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, color }}
        >
          <Icon name={icon} size={18} />
        </div>
        {delta && (
          <span
            className={`font-mono text-[10px] font-bold flex items-center gap-0.5 ${
              deltaUp ? 'text-[#30d158]' : 'text-[#ff453a]'
            }`}
          >
            <Icon name={deltaUp ? 'trending_up' : 'trending_down'} size={13} /> {delta}
          </span>
        )}
      </div>
      <div className="text-white font-bold text-2xl mt-3 tracking-tight">{value}</div>
      <div className="font-mono text-[10px] text-[#8b90a0] uppercase mt-1 tracking-wider">{label}</div>
    </div>
  )
}

export function Pill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Delivered: 'bg-[#30d15815] text-[#30d158] border-[#30d15840]',
    Shipped: 'bg-[#007aff15] text-[#007aff] border-[#007aff40]',
    Processing: 'bg-[#ffd60a15] text-[#ffd60a] border-[#ffd60a40]',
    Cancelled: 'bg-[#ff453a15] text-[#ff453a] border-[#ff453a40]',
    Paid: 'bg-[#30d15815] text-[#30d158] border-[#30d15840]',
    Pending: 'bg-[#ffd60a15] text-[#ffd60a] border-[#ffd60a40]',
    Refunded: 'bg-[#ff453a15] text-[#ff453a] border-[#ff453a40]',
    Active: 'bg-[#30d15815] text-[#30d158] border-[#30d15840]',
    VIP: 'bg-[#bf5af215] text-[#bf5af2] border-[#bf5af240]',
    Inactive: 'bg-[#8b90a015] text-[#8b90a0] border-[#8b90a040]',
    'in-stock': 'bg-[#30d15815] text-[#30d158] border-[#30d15840]',
    'low-stock': 'bg-[#ffd60a15] text-[#ffd60a] border-[#ffd60a40]',
    'out-of-stock': 'bg-[#ff453a15] text-[#ff453a] border-[#ff453a40]',
    Scheduled: 'bg-[#007aff15] text-[#007aff] border-[#007aff40]',
    Expired: 'bg-[#8b90a015] text-[#8b90a0] border-[#8b90a040]',
  }
  const label = status.replace('-', ' ').toUpperCase()
  return (
    <span
      className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold border whitespace-nowrap ${
        map[status] || 'bg-[#292a2e] text-[#c1c6d7] border-[#414755]'
      }`}
    >
      {label}
    </span>
  )
}
