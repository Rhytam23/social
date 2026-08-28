import { useState, useCallback } from 'react'
import { NavLink, Outlet, Link, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { Icon, Breadcrumbs, EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { ProductGrid } from '../../components/products/ProductCard'
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { orderService } from '../../services/orderService'
import { productService } from '../../services/productService'
import { authService } from '../../services/authService'
import { addressService, UserAddress } from '../../services/addressService'

const NAV = [
  { to: '/account', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/account/orders', label: 'Orders', icon: 'package_2', end: false },
  { to: '/account/addresses', label: 'Addresses', icon: 'location_on', end: false },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'favorite', end: false },
  { to: '/account/settings', label: 'Settings', icon: 'settings', end: false },
]

const STATUS_LABELS: Record<string, string> = {
  processing: 'Processing',
  assembling: 'Assembling',
  quality_check: 'Quality check',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Account' }]} className="mb-5" />

        {/* Real signed-in identity */}
        <div className="flex items-center gap-4 p-5 bg-(--bg-surface) border border-(--border-theme) rounded-xl mb-6">
          <div className="w-14 h-14 rounded-full bg-(--accent-blue)/15 border border-(--accent-blue)/40 flex items-center justify-center text-(--accent-blue) shrink-0 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" size={28} />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-(--text-primary) font-bold text-xl truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'My Account'}
            </h1>
            <p className="text-(--text-secondary) text-xs font-mono mt-0.5 truncate">
              {user?.email}
              {memberSince ? ` · Member since ${memberSince}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none pb-2 lg:pb-0">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 p-3 rounded-lg font-mono text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-(--accent-blue) text-white'
                        : 'bg-(--bg-surface) border border-(--border-theme) text-(--text-secondary) hover:text-(--text-primary)'
                    }`
                  }
                >
                  <Icon name={item.icon} size={16} /> <span className="uppercase">{item.label}</span>
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex items-center gap-2.5 p-3 rounded-lg font-mono text-xs font-bold text-(--text-secondary) hover:text-rose-500 transition-colors shrink-0 cursor-pointer text-left"
              >
                <Icon name="logout" size={16} /> <span className="uppercase">Sign Out</span>
              </button>
            </nav>
          </aside>
          <div className="lg:col-span-9 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}

// ─── Account router (lazy chunk entry) ───────────────────────────────────────────

export default function AccountApp() {
  return (
    <Routes>
      <Route element={<AccountLayout />}>
        <Route index element={<AccountDashboard />} />
        <Route path="orders" element={<AccountOrders />} />
        <Route path="orders/:id" element={<AccountOrderDetails />} />
        <Route path="addresses" element={<AccountAddresses />} />
        <Route path="wishlist" element={<AccountWishlist />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>
    </Routes>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: 'bg-(--color-stock-green)/15 text-(--color-stock-green) border-(--color-stock-green)/40',
    shipped: 'bg-(--accent-blue)/15 text-(--accent-blue) border-(--accent-blue)/40',
    processing: 'bg-(--color-stock-yellow-val)/15 text-(--color-stock-yellow-val) border-(--color-stock-yellow-val)/40',
    cancelled: 'bg-rose-500/15 text-rose-500 border-rose-500/40',
    refunded: 'bg-rose-500/15 text-rose-500 border-rose-500/40',
  }
  return (
    <span
      className={`font-mono text-[10px] px-2.5 py-1 rounded-md font-bold border whitespace-nowrap ${
        map[status] || 'bg-(--bg-surface-secondary) text-(--text-secondary) border-(--border-theme)'
      }`}
    >
      {(STATUS_LABELS[status] ?? status).toUpperCase()}
    </span>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function AccountDashboard() {
  const { wishlistCount } = useWishlist()
  const { data, loading, error, reload } = useApi(
    useCallback(() => orderService.listMyOrders(1, 5), []),
    []
  )

  const orders = data?.orders ?? []
  const totalOrders = data?.total ?? 0
  // Only paid orders count toward lifetime spend.
  const totalSpent = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)

  const stats = [
    { label: 'Total Orders', value: loading ? '—' : totalOrders, icon: 'package_2', color: '#007aff' },
    { label: 'Paid (recent)', value: loading ? '—' : `$${totalSpent.toFixed(0)}`, icon: 'payments', color: '#30d158' },
    { label: 'Wishlist Items', value: wishlistCount, icon: 'favorite', color: '#ff453a' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-4">
            <Icon name={s.icon} size={20} style={{ color: s.color }} />
            <div className="text-(--text-primary) font-bold text-xl mt-2">{s.value}</div>
            <div className="font-mono text-[10px] text-(--text-secondary) uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-(--text-primary) font-bold text-base">Recent Orders</h2>
          <Link
            to="/account/orders"
            className="font-mono text-[11px] text-(--accent-blue) hover:underline flex items-center gap-1"
          >
            VIEW ALL <Icon name="chevron_right" size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="h-24 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="package_2"
            title="No orders yet"
            message="Your orders will appear here once you place one."
            action={
              <Link to="/products">
                <Button variant="primary" size="md">START SHOPPING</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                to={`/account/orders/${o.id}`}
                className="flex items-center justify-between gap-3 p-4 bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs text-(--accent-blue) font-bold">{o.orderNumber}</span>
                  <p className="text-(--text-secondary) text-[11px] font-mono">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-mono text-(--text-primary) font-bold text-sm">${o.total.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Orders list ───────────────────────────────────────────────────────────────

export function AccountOrders() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useApi(
    useCallback(() => orderService.listMyOrders(page, 10), [page]),
    [page]
  )

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 10))

  return (
    <div className="space-y-4">
      <h2 className="text-(--text-primary) font-bold text-base">Order History</h2>

      {loading ? (
        <div className="h-48 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="package_2"
          title="No orders yet"
          message="When you place an order it will appear here."
          action={
            <Link to="/products">
              <Button variant="primary" size="md">BROWSE PRODUCTS</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/account/orders/${o.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs text-(--accent-blue) font-bold">{o.orderNumber}</span>
                  <p className="text-(--text-secondary) text-[11px] font-mono mt-0.5">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s) · Payment: {o.paymentStatus}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-mono text-(--text-primary) font-bold text-sm">${o.total.toFixed(2)}</span>
                  <Icon name="chevron_right" size={16} className="text-(--text-secondary)" />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                PREVIOUS
              </Button>
              <span className="font-mono text-xs text-(--text-secondary)">
                PAGE {page} / {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                NEXT
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Order details ─────────────────────────────────────────────────────────────

export function AccountOrderDetails() {
  const { id } = useParams()
  const { data: order, loading, error, reload } = useApi(
    useCallback(() => (id ? orderService.getOrder(id) : Promise.resolve(null)), [id]),
    [id]
  )

  if (loading) {
    return <div className="h-64 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
  }

  if (error || !order) {
    return error ? (
      <ErrorState message={error} onRetry={reload} />
    ) : (
      <EmptyState
        icon="receipt_long"
        title="Order not found"
        message="This order does not exist or is not associated with your account."
        action={
          <Link to="/account/orders">
            <Button variant="primary" size="md">BACK TO ORDERS</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link
            to="/account/orders"
            className="font-mono text-[11px] text-(--accent-blue) hover:underline flex items-center gap-1 mb-1"
          >
            <Icon name="arrow_back" size={13} /> ALL ORDERS
          </Link>
          <h2 className="text-(--text-primary) font-bold text-lg font-mono">{order.orderNumber}</h2>
          <p className="text-(--text-secondary) text-xs font-mono mt-0.5">
            Placed {new Date(order.createdAt).toLocaleString()} · Payment: {order.paymentStatus}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl overflow-hidden">
        <div className="p-4 bg-(--bg-surface-secondary) border-b border-(--border-theme) font-mono text-xs text-(--text-secondary) font-semibold uppercase">
          Items ({order.items.length})
        </div>
        <div className="divide-y divide-(--border-theme)">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              {item.productImageUrl ? (
                <img
                  src={item.productImageUrl}
                  alt=""
                  className="w-14 h-14 object-cover rounded-lg bg-(--bg-surface-secondary) shrink-0"
                />
              ) : (
                <span className="w-14 h-14 rounded-lg bg-(--bg-surface-secondary) shrink-0 flex items-center justify-center">
                  <Icon name="memory" size={22} className="text-(--accent-blue)" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-(--text-primary) text-xs font-bold truncate">{item.productName}</h3>
                <span className="font-mono text-[10px] text-(--text-secondary)">
                  SKU {item.productSku} · Qty {item.quantity} · ${item.unitPrice.toFixed(2)} ea
                </span>
              </div>
              <span className="font-mono text-(--text-primary) font-bold text-sm shrink-0">
                ${item.lineTotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="p-4 bg-(--bg-surface-secondary) border-t border-(--border-theme) space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-(--text-secondary)">
            <span>Subtotal</span>
            <span className="text-(--text-primary)">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-(--text-secondary)">
            <span>Shipping</span>
            <span className="text-(--text-primary)">
              {order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-(--text-secondary)">
            <span>Tax</span>
            <span className="text-(--text-primary)">${order.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-(--text-primary) pt-2 border-t border-(--border-theme)">
            <span>Total</span>
            <span className="text-(--accent-blue)">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping + timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
          <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase mb-3 flex items-center gap-1.5">
            <Icon name="local_shipping" size={16} className="text-(--accent-blue)" /> Shipping To
          </h3>
          <div className="text-xs font-mono text-(--text-secondary) leading-relaxed">
            <strong className="text-(--text-primary) block text-sm">{order.shippingName}</strong>
            <p>{order.shippingStreet}</p>
            <p>
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
            <p>{order.shippingCountry}</p>
          </div>
          {order.trackingNumber && (
            <p className="text-xs font-mono text-(--text-secondary) mt-3 pt-3 border-t border-(--border-theme)">
              Tracking: <span className="text-(--text-primary)">{order.trackingNumber}</span>
            </p>
          )}
          <Link
            to={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
            className="text-xs text-(--accent-blue) hover:underline mt-3 inline-flex items-center gap-1"
          >
            Track this order <Icon name="chevron_right" size={14} />
          </Link>
        </div>

        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
          <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase mb-3 flex items-center gap-1.5">
            <Icon name="timeline" size={16} className="text-(--accent-blue)" /> Order Timeline
          </h3>
          {order.timeline.length === 0 ? (
            <p className="text-xs text-(--text-secondary)">No timeline entries yet.</p>
          ) : (
            <ol className="space-y-3">
              {order.timeline.map((t) => (
                <li key={t.id} className="text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-(--text-primary) font-semibold capitalize">
                      {STATUS_LABELS[t.status] ?? t.status.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-(--text-secondary)">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {t.description && <p className="text-(--text-secondary) mt-0.5">{t.description}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Wishlist ──────────────────────────────────────────────────────────────────

export function AccountWishlist() {
  const { wishlistIds, wishlistCount } = useWishlist()
  const { data, loading, error, reload } = useApi(
    useCallback(
      () => (wishlistIds.length ? productService.list({ ids: wishlistIds, limit: 100 }) : Promise.resolve(null)),
      [wishlistIds]
    ),
    [wishlistIds.join(',')]
  )

  const products = data?.data ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-(--text-primary) font-bold text-base">Saved Items ({wishlistCount})</h2>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="favorite_border"
          title="Your wishlist is empty"
          message="Save items with the heart icon to find them here later."
          action={
            <Link to="/products">
              <Button variant="primary" size="md">BROWSE PRODUCTS</Button>
            </Link>
          }
        />
      ) : (
        <ProductGrid products={products} columns={3} />
      )}
    </div>
  )
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export function AccountSettings() {
  const { user, refresh } = useAuth()

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  })
  const [profileState, setProfileState] = useState<{ saving: boolean; message: string | null; error: string | null }>({
    saving: false,
    message: null,
    error: null,
  })

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [passwordState, setPasswordState] = useState<{ saving: boolean; message: string | null; error: string | null }>({
    saving: false,
    message: null,
    error: null,
  })

  const inputClass =
    'w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 text-xs text-(--text-primary) focus:outline-none focus:border-(--accent-blue)'
  const labelClass = 'text-[11px] font-mono text-(--text-secondary) block mb-1 uppercase font-semibold'

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileState({ saving: true, message: null, error: null })
    try {
      await authService.updateProfile(profile)
      await refresh()
      setProfileState({ saving: false, message: 'Profile updated', error: null })
    } catch (err) {
      setProfileState({
        saving: false,
        message: null,
        error: err instanceof Error ? err.message : 'Could not update profile',
      })
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordState({ saving: true, message: null, error: null })
    try {
      await authService.changePassword(passwords.currentPassword, passwords.newPassword)
      setPasswords({ currentPassword: '', newPassword: '' })
      setPasswordState({ saving: false, message: 'Password updated', error: null })
    } catch (err) {
      setPasswordState({
        saving: false,
        message: null,
        error: err instanceof Error ? err.message : 'Could not update password',
      })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-(--text-primary) font-bold text-base">Account Settings</h2>

      {/* Profile */}
      <form onSubmit={handleProfileSave} className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5 space-y-4">
        <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase border-b border-(--border-theme) pb-3">
          Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="acc-first">First Name</label>
            <input
              id="acc-first"
              className={inputClass}
              value={profile.firstName}
              onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="acc-last">Last Name</label>
            <input
              id="acc-last"
              className={inputClass}
              value={profile.lastName}
              onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="acc-phone">Phone</label>
            <input
              id="acc-phone"
              className={inputClass}
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="acc-email">Email (read only)</label>
            <input id="acc-email" className={`${inputClass} opacity-60`} value={user?.email ?? ''} readOnly />
          </div>
        </div>

        {profileState.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
            {profileState.error}
          </div>
        )}
        {profileState.message && (
          <div className="p-3 bg-(--color-stock-green)/10 border border-(--color-stock-green)/20 rounded-lg text-(--color-stock-green) text-xs font-mono">
            {profileState.message}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" disabled={profileState.saving}>
          {profileState.saving ? 'SAVING…' : 'SAVE CHANGES'}
        </Button>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordSave} className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5 space-y-4">
        <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase border-b border-(--border-theme) pb-3">
          Change Password
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="acc-cur-pass">Current Password</label>
            <input
              id="acc-cur-pass"
              type="password"
              className={inputClass}
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="acc-new-pass">New Password</label>
            <input
              id="acc-new-pass"
              type="password"
              minLength={8}
              className={inputClass}
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </div>
        </div>

        {passwordState.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
            {passwordState.error}
          </div>
        )}
        {passwordState.message && (
          <div className="p-3 bg-(--color-stock-green)/10 border border-(--color-stock-green)/20 rounded-lg text-(--color-stock-green) text-xs font-mono">
            {passwordState.message}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" disabled={passwordState.saving}>
          {passwordState.saving ? 'UPDATING…' : 'UPDATE PASSWORD'}
        </Button>
      </form>
    </div>
  )
}

// ─── Addresses ─────────────────────────────────────────────────────────────────

export function AccountAddresses() {
  const { data: addresses = [], loading, error, reload } = useApi(
    useCallback(() => addressService.listAddresses(), []),
    []
  )

  const [showAddForm, setShowAddForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    isDefault: true,
  })

  const inputClass =
    'w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 text-xs text-(--text-primary) focus:outline-none focus:border-(--accent-blue)'
  const labelClass = 'text-[11px] font-mono text-(--text-secondary) block mb-1 uppercase font-semibold'

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await addressService.createAddress(newAddress)
      setNewAddress({
        fullName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        phone: '',
        isDefault: false,
      })
      setShowAddForm(false)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add address')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping address?')) return
    setBusy(true)
    try {
      await addressService.deleteAddress(id)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete address')
    } finally {
      setBusy(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    setBusy(true)
    try {
      await addressService.setDefaultAddress(id)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not set default address')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-(--text-primary) font-bold text-base">Shipping Addresses</h2>
          <p className="text-(--text-secondary) text-xs mt-0.5">Manage your saved delivery destinations for faster checkout.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          <Icon name={showAddForm ? 'close' : 'add'} size={16} />
          {showAddForm ? 'CANCEL' : 'ADD ADDRESS'}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-(--bg-surface) border border-(--accent-blue)/40 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="font-mono text-xs font-bold text-(--accent-blue) uppercase tracking-wider border-b border-(--border-theme) pb-3 flex items-center gap-2">
            <Icon name="location_on" size={16} /> New Delivery Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="addr-name">Full Recipient Name</label>
              <input
                id="addr-name"
                className={inputClass}
                placeholder="e.g. John Doe"
                value={newAddress.fullName}
                onChange={(e) => setNewAddress((a) => ({ ...a, fullName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="addr-phone">Contact Phone</label>
              <input
                id="addr-phone"
                className={inputClass}
                placeholder="e.g. (555) 019-2834"
                value={newAddress.phone}
                onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="addr-street">Street Address</label>
            <input
              id="addr-street"
              className={inputClass}
              placeholder="e.g. 123 Tech Blvd, Suite 400"
              value={newAddress.street}
              onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="addr-city">City</label>
              <input
                id="addr-city"
                className={inputClass}
                placeholder="e.g. San Francisco"
                value={newAddress.city}
                onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="addr-state">State / Province</label>
              <input
                id="addr-state"
                className={inputClass}
                placeholder="e.g. CA"
                value={newAddress.state}
                onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="addr-zip">ZIP / Postal Code</label>
              <input
                id="addr-zip"
                className={inputClass}
                placeholder="e.g. 94107"
                value={newAddress.zipCode}
                onChange={(e) => setNewAddress((a) => ({ ...a, zipCode: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="addr-default"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress((a) => ({ ...a, isDefault: e.target.checked }))}
              className="accent-(--accent-blue)"
            />
            <label htmlFor="addr-default" className="text-xs text-(--text-primary) font-mono cursor-pointer">
              Set as my default shipping address
            </label>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
              {formError}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" disabled={busy}>
            {busy ? 'SAVING ADDRESS…' : 'SAVE ADDRESS'}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="h-48 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="location_on"
          title="No saved shipping addresses"
          message="Add a delivery address to speed up your future orders."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a: UserAddress) => (
            <div
              key={a.id}
              className={`p-5 rounded-xl border transition-all relative flex flex-col justify-between ${
                a.isDefault
                  ? 'bg-(--bg-surface) border-(--accent-blue) ring-1 ring-(--accent-blue)/30'
                  : 'bg-(--bg-surface) border-(--border-theme) hover:border-(--text-secondary)'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-(--text-primary)">{a.fullName}</span>
                  {a.isDefault && (
                    <span className="font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-(--accent-blue)/15 text-(--accent-blue) border border-(--accent-blue)/30">
                      DEFAULT
                    </span>
                  )}
                </div>
                <div className="text-xs text-(--text-secondary) space-y-1 font-mono">
                  <p>{a.street}</p>
                  <p>{a.city}, {a.state} {a.zipCode}</p>
                  <p>{a.country}</p>
                  {a.phone && <p className="text-[11px] text-(--text-secondary)/80 mt-1">Phone: {a.phone}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-(--border-theme) pt-3 mt-4">
                {!a.isDefault && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSetDefault(a.id)}
                    className="font-mono text-[11px] text-(--accent-blue) hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete(a.id)}
                  className="font-mono text-[11px] text-rose-500 hover:underline cursor-pointer disabled:opacity-50 ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
