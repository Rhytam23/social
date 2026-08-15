import { NavLink, Outlet, Link, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { Icon, Breadcrumbs, EmptyState, StockBadge } from '../../components/ui'
import { ProductGrid } from '../../components/products/ProductCard'
import { useShop } from '../../context/ShopContext'
import { allProducts } from '../../data'

const NAV = [
  { to: '/account', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/account/orders', label: 'Orders', icon: 'package_2', end: false },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'favorite', end: false },
  { to: '/account/addresses', label: 'Addresses', icon: 'home_pin', end: false },
  { to: '/account/payments', label: 'Payment Methods', icon: 'credit_card', end: false },
  { to: '/account/settings', label: 'Settings', icon: 'settings', end: false },
]

// ─── Layout ────────────────────────────────────────────────────────────────────

export function AccountLayout() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Account' }]} className="mb-5" />

        <div className="flex items-center gap-4 p-5 bg-[#16171d] border border-[#414755] rounded mb-6">
          <div className="w-14 h-14 rounded-full bg-[#007aff20] border border-[#007aff40] flex items-center justify-center text-[#007aff] shrink-0">
            <Icon name="person" size={28} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white font-bold text-xl">Alexandre Vance</h1>
              <span className="font-mono text-[10px] text-[#30d158] bg-[#30d15815] px-2 py-0.5 rounded border border-[#30d15830] font-bold">VIP MEMBER</span>
            </div>
            <p className="text-[#8b90a0] text-xs font-mono mt-0.5 truncate">alex.vance@blackmesa.org · Member since 2024</p>
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
                    `flex items-center gap-2.5 p-3 rounded font-mono text-xs font-bold transition-all shrink-0 ${
                      isActive ? 'bg-[#007aff] text-white' : 'bg-[#1a1b1f] border border-[#292a2e] text-[#8b90a0] hover:text-white hover:border-[#414755]'
                    }`
                  }
                >
                  <Icon name={item.icon} size={16} /> <span className="uppercase">{item.label}</span>
                </NavLink>
              ))}
              <Link to="/" className="flex items-center gap-2.5 p-3 rounded font-mono text-xs font-bold text-[#8b90a0] hover:text-[#ff453a] transition-colors shrink-0">
                <Icon name="logout" size={16} /> <span className="uppercase">Sign Out</span>
              </Link>
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
        <Route path="wishlist" element={<AccountWishlist />} />
        <Route path="addresses" element={<AccountAddresses />} />
        <Route path="payments" element={<AccountPayments />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>
    </Routes>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function AccountDashboard() {
  const { orders, wishlistCount } = useShop()
  const totalSpent = orders.reduce((s, o) => s + o.total, 0)
  const stats = [
    { label: 'Total Orders', value: orders.length, icon: 'package_2', color: '#007aff' },
    { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, icon: 'payments', color: '#30d158' },
    { label: 'Wishlist Items', value: wishlistCount, icon: 'favorite', color: '#ff453a' },
    { label: 'Reward Points', value: '4,280', icon: 'stars', color: '#ffd60a' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#1a1b1f] border border-[#414755] rounded p-4">
            <Icon name={s.icon} size={20} style={{ color: s.color }} />
            <div className="text-white font-bold text-xl mt-2">{s.value}</div>
            <div className="font-mono text-[10px] text-[#8b90a0] uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-base">Recent Orders</h2>
          <Link to="/account/orders" className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1">VIEW ALL <Icon name="chevron_right" size={13} /></Link>
        </div>
        <div className="space-y-2">
          {orders.slice(0, 3).map((o) => (
            <Link key={o.id} to={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 bg-[#1a1b1f] border border-[#414755] hover:border-[#007aff] rounded transition-colors">
              <div className="min-w-0">
                <span className="font-mono text-xs text-[#007aff] font-bold">{o.id}</span>
                <p className="text-[#8b90a0] text-[11px] font-mono">{o.date} · {o.items.length} item(s)</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <OrderStatusBadge status={o.status} />
                <span className="font-mono text-white font-bold text-sm">${o.total.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Delivered: 'bg-[#30d15820] text-[#30d158] border-[#30d15840]',
    Shipped: 'bg-[#007aff20] text-[#007aff] border-[#007aff40]',
    Processing: 'bg-[#ffd60a15] text-[#ffd60a] border-[#ffd60a40]',
  }
  return <span className={`font-mono text-[10px] px-2.5 py-1 rounded font-bold border ${map[status] || 'bg-[#292a2e] text-[#c1c6d7] border-[#414755]'}`}>{status.toUpperCase()}</span>
}

// ─── Orders list ───────────────────────────────────────────────────────────────

export function AccountOrders() {
  const { orders } = useShop()
  if (!orders.length) {
    return <EmptyState icon="package_2" title="No orders yet" message="When you place an order it will appear here." action={<Link to="/products" className="px-4 py-2 bg-[#007aff] text-white font-mono text-xs rounded font-bold">START SHOPPING</Link>} />
  }
  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-lg mb-1">Order History</h2>
      {orders.map((o) => (
        <div key={o.id} className="p-5 bg-[#1a1b1f] border border-[#414755] rounded">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#292a2e]">
            <div>
              <span className="font-mono text-xs text-[#007aff] font-bold block">{o.id}</span>
              <span className="text-[11px] font-mono text-[#8b90a0]">Placed {o.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={o.status} />
              <Link to={`/account/orders/${o.id}`} className="px-3 py-1.5 bg-[#121317] border border-[#414755] hover:border-white text-white font-mono text-xs rounded transition-colors">VIEW DETAILS</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {o.items.slice(0, 4).map(({ product }) => (
              <img key={product.id} src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded bg-[#0d0e12] border border-[#292a2e]" />
            ))}
            <div className="ml-auto text-right">
              <span className="font-mono text-[10px] text-[#8b90a0] block">TOTAL</span>
              <span className="text-[#007aff] font-bold text-sm">${o.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Order details + tracking ────────────────────────────────────────────────────

export function AccountOrderDetails() {
  const { id } = useParams()
  const { getOrder } = useShop()
  const order = id ? getOrder(id) : undefined

  if (!order) {
    return <EmptyState icon="receipt_long" title="Order not found" message="We couldn't find that order." action={<Link to="/account/orders" className="px-4 py-2 bg-[#007aff] text-white font-mono text-xs rounded font-bold">BACK TO ORDERS</Link>} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link to="/account/orders" className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1 mb-1"><Icon name="arrow_back" size={13} /> ALL ORDERS</Link>
          <h2 className="text-white font-bold text-xl">Order {order.id}</h2>
          <span className="text-[#8b90a0] text-xs font-mono">Placed {order.date}</span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Tracking timeline */}
      <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
        <h3 className="font-mono text-xs font-bold text-white uppercase mb-4">Order Tracking · {order.trackingNumber}</h3>
        <ol className="relative">
          {order.timeline.map((t, i) => (
            <li key={t.status} className="flex gap-3 pb-5 last:pb-0 relative">
              {i < order.timeline.length - 1 && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${t.completed ? 'bg-[#30d158]' : 'bg-[#414755]'}`} />}
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border ${t.completed ? 'bg-[#30d158] border-[#30d158] text-[#0d0e12]' : 'bg-[#121317] border-[#414755] text-[#8b90a0]'}`}>
                <Icon name={t.completed ? 'check' : 'schedule'} size={13} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${t.completed ? 'text-white' : 'text-[#8b90a0]'}`}>{t.status}</span>
                  <span className="font-mono text-[10px] text-[#8b90a0]">{t.date}</span>
                </div>
                <p className="text-[#8b90a0] text-xs mt-0.5">{t.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items */}
        <div className="lg:col-span-2 bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden">
          <div className="p-4 bg-[#1e1f23] border-b border-[#292a2e] font-mono text-xs text-[#8b90a0] font-semibold uppercase">Items</div>
          <div className="divide-y divide-[#292a2e]">
            {order.items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded bg-[#0d0e12] shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${product.slug}`}><h4 className="text-white text-xs font-bold truncate hover:text-[#adc6ff]">{product.name}</h4></Link>
                  <div className="flex items-center gap-2 mt-1"><StockBadge status={product.stockStatus} /><span className="font-mono text-[10px] text-[#8b90a0]">Qty: {quantity}</span></div>
                </div>
                <span className="font-mono text-white font-bold text-sm shrink-0">${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + address + payment */}
        <div className="space-y-4">
          <div className="bg-[#1a1b1f] border border-[#414755] rounded p-4 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-[#8b90a0]"><span>Subtotal</span><span className="text-white">${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-[#8b90a0]"><span>Shipping</span><span className={order.shipping === 0 ? 'text-[#30d158]' : 'text-white'}>{order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-[#8b90a0]"><span>Tax</span><span className="text-white">${order.tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#292a2e]"><span>Total</span><span className="text-[#007aff]">${order.total.toFixed(2)}</span></div>
          </div>
          <div className="bg-[#1a1b1f] border border-[#414755] rounded p-4">
            <span className="font-mono text-[10px] text-[#8b90a0] uppercase block mb-2">Shipping Address</span>
            <div className="text-xs text-[#c1c6d7] leading-relaxed font-mono">
              <strong className="text-white block">{order.shippingAddress.name}</strong>
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
              {order.shippingAddress.country}
            </div>
          </div>
          {order.paymentMethod && (
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-4">
              <span className="font-mono text-[10px] text-[#8b90a0] uppercase block mb-2">Payment</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-mono">{order.paymentMethod}</span>
                <span className="font-mono text-[10px] text-[#30d158] border border-[#30d15840] px-2 py-0.5 rounded">{order.paymentStatus}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Wishlist ──────────────────────────────────────────────────────────────────

export function AccountWishlist() {
  const { wishlist, addToCart, toggleWishlist } = useShop()
  const items = allProducts.filter((p) => wishlist.has(p.id))
  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-lg">Saved Items ({items.length})</h2>
      {items.length ? (
        <ProductGrid products={items} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlistedIds={wishlist} columns={3} />
      ) : (
        <EmptyState icon="favorite" title="Your wishlist is empty" message="Save products you love to find them here later." action={<Link to="/products" className="px-4 py-2 bg-[#007aff] text-white font-mono text-xs rounded font-bold">DISCOVER PRODUCTS</Link>} />
      )}
    </div>
  )
}

// ─── Addresses ─────────────────────────────────────────────────────────────────

const ADDRESSES = [
  { id: 'a1', label: 'Home', name: 'Alexandre Vance', street: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zip: '97477', country: 'United States', primary: true },
  { id: 'a2', label: 'Office', name: 'Alexandre Vance', street: '1200 Tech Park Blvd, Suite 400', city: 'Portland', state: 'OR', zip: '97204', country: 'United States', primary: false },
]

export function AccountAddresses() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Saved Addresses</h2>
        <button className="px-3.5 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors"><Icon name="add" size={15} /> ADD ADDRESS</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ADDRESSES.map((a) => (
          <div key={a.id} className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-white uppercase">{a.label}</span>
              {a.primary && <span className="font-mono text-[9px] text-[#007aff] bg-[#007aff15] px-2 py-0.5 rounded border border-[#007aff30]">DEFAULT</span>}
            </div>
            <div className="text-xs text-[#c1c6d7] font-mono leading-relaxed">
              <strong className="text-white block">{a.name}</strong>
              {a.street}<br />{a.city}, {a.state} {a.zip}<br />{a.country}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 bg-[#121317] border border-[#414755] hover:border-white text-white font-mono text-[10px] rounded transition-colors">EDIT</button>
              <button className="flex-1 py-2 bg-[#121317] border border-[#414755] hover:border-[#ff453a] text-[#8b90a0] hover:text-[#ff453a] font-mono text-[10px] rounded transition-colors">REMOVE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Payment methods ─────────────────────────────────────────────────────────────

const CARDS = [
  { id: 'c1', brand: 'Visa', last4: '4242', exp: '12/28', primary: true },
  { id: 'c2', brand: 'Mastercard', last4: '5588', exp: '09/27', primary: false },
]

export function AccountPayments() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Payment Methods</h2>
        <button className="px-3.5 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors"><Icon name="add" size={15} /> ADD CARD</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <div key={c.id} className="bg-gradient-to-br from-[#1e1f23] to-[#16171d] border border-[#414755] rounded p-5">
            <div className="flex items-center justify-between mb-6">
              <Icon name="credit_card" size={24} className="text-[#007aff]" />
              {c.primary && <span className="font-mono text-[9px] text-[#30d158] border border-[#30d15840] px-2 py-0.5 rounded">DEFAULT</span>}
            </div>
            <div className="font-mono text-white text-lg tracking-widest mb-3">•••• •••• •••• {c.last4}</div>
            <div className="flex items-center justify-between font-mono text-[10px] text-[#8b90a0]">
              <span>{c.brand.toUpperCase()}</span><span>EXP {c.exp}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[#8b90a0] text-[11px] font-mono flex items-center gap-1.5"><Icon name="lock" size={13} /> Cards are tokenized — full numbers are never stored on our servers.</p>
    </div>
  )
}

// ─── Settings (profile / security / notifications) ────────────────────────────────

export function AccountSettings() {
  const navigate = useNavigate()
  const field = 'w-full bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff]'
  const lbl = 'text-[11px] font-mono text-[#8b90a0] block mb-1'
  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Settings</h2>

      {/* Profile */}
      <section className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
        <h3 className="font-mono text-xs font-bold text-white uppercase mb-4 border-b border-[#292a2e] pb-3">Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>FULL NAME</label><input className={field} defaultValue="Alexandre Vance" /></div>
          <div><label className={lbl}>EMAIL</label><input className={field} defaultValue="alex.vance@blackmesa.org" /></div>
          <div><label className={lbl}>PHONE</label><input className={field} defaultValue="+1 (555) 234-5678" /></div>
          <div><label className={lbl}>LANGUAGE</label>
            <select className={field}><option>English (US)</option><option>Deutsch</option><option>Français</option></select>
          </div>
        </div>
        <button className="mt-4 px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors">SAVE CHANGES</button>
      </section>

      {/* Security */}
      <section className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
        <h3 className="font-mono text-xs font-bold text-white uppercase mb-4 border-b border-[#292a2e] pb-3">Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><span className="text-white text-sm font-medium">Password</span><p className="text-[#8b90a0] text-xs">Last changed 3 months ago</p></div>
            <button onClick={() => navigate('/forgot-password')} className="px-3 py-1.5 bg-[#121317] border border-[#414755] hover:border-white text-white font-mono text-[10px] rounded transition-colors">CHANGE</button>
          </div>
          <div className="flex items-center justify-between border-t border-[#292a2e] pt-3">
            <div><span className="text-white text-sm font-medium">Two-Factor Authentication</span><p className="text-[#30d158] text-xs flex items-center gap-1"><Icon name="verified" size={13} /> Hardware key active</p></div>
            <span className="font-mono text-[10px] text-[#30d158] border border-[#30d15840] px-2 py-1 rounded">ENABLED</span>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
        <h3 className="font-mono text-xs font-bold text-white uppercase mb-4 border-b border-[#292a2e] pb-3">Notifications</h3>
        <div className="space-y-3">
          {[
            { label: 'Order status updates', on: true },
            { label: 'Flash deals & promotions', on: true },
            { label: 'Price-drop alerts on wishlist', on: false },
            { label: 'Product restock notifications', on: true },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[#c1c6d7]">{n.label}</span>
              <span className={`relative w-10 h-5 rounded-full transition-colors ${n.on ? 'bg-[#007aff]' : 'bg-[#414755]'}`}>
                <input type="checkbox" defaultChecked={n.on} className="sr-only peer" />
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${n.on ? 'left-[22px]' : 'left-0.5'}`} />
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
