import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { LineChart, DonutChart } from '../../components/ui/Charts'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { revenueSeries, categoryRevenue } from '../../data'
import { useShop } from '../../context/ShopContext'

export function AdminDashboard() {
  const { products, orders, customers } = useShop()
  const topProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5)
  const lowStock = products.filter((p) => p.stockStatus !== 'in-stock').length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Store performance overview · Real-time storefront telemetry"
        action={
          <Link to="/admin/products" className="px-3.5 py-2 bg-[var(--accent-blue)] text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
            <Icon name="add" size={15} /> MANAGE CATALOG
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Sales" value={`$${Math.round(totalRevenue || 12450).toLocaleString()}`} delta="12.4%" deltaUp icon="payments" color="#16a34a" />
        <StatCard label="Total Orders" value={String(orders.length)} delta="8.4%" deltaUp icon="receipt_long" color="#0066FF" />
        <StatCard label="Total Customers" value={String(customers.length * 24)} delta="5.1%" deltaUp icon="group" color="#a855f7" />
        <StatCard label="Total Products" value={String(products.length)} icon="inventory_2" color="#eab308" />
        <StatCard label="Low Stock" value={String(lowStock)} delta={`${lowStock} items`} icon="warning" color="#ea580c" />
        <StatCard label="Conversion" value="3.8%" delta="0.3%" deltaUp icon="conversion_path" color="#06b6d4" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-[var(--bg-surface-secondary)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[var(--text-primary)] font-bold text-sm">Revenue Trend</h2>
            <span className="font-mono text-[10px] text-[var(--color-stock-green)] flex items-center gap-1"><Icon name="trending_up" size={13} /> +11.2% MoM</span>
          </div>
          <LineChart data={revenueSeries} format={(v) => `$${Math.round(v / 1000)}k`} />
        </div>
        <div className="bg-[var(--bg-surface-secondary)] rounded-xl p-5 flex flex-col justify-between">
          <h2 className="text-[var(--text-primary)] font-bold text-sm mb-4">Revenue by Category</h2>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart data={categoryRevenue} size={180} />
          </div>
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--bg-surface-secondary)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-theme)]">
            <h2 className="text-[var(--text-primary)] font-bold text-sm">Recent Orders</h2>
            <Link to="/admin/orders" className="font-mono text-[11px] text-[var(--accent-blue)] hover:underline flex items-center gap-1">VIEW ALL <Icon name="chevron_right" size={13} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="font-mono text-[10px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-theme)]">
                  <th className="text-left p-3 font-semibold">Order</th>
                  <th className="text-left p-3 font-semibold">Customer</th>
                  <th className="text-right p-3 font-semibold">Amount</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-theme)]">
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-surface-tertiary)] transition-colors">
                    <td className="p-3 font-mono text-[var(--accent-blue)] font-bold">#{o.id}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{o.customerName || o.shippingAddress?.name || 'Customer'}</td>
                    <td className="p-3 text-right font-mono text-[var(--text-primary)] font-bold">${(o.total || 0).toFixed(2)}</td>
                    <td className="p-3 text-center"><Pill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[var(--bg-surface-secondary)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-theme)]">
            <h2 className="text-[var(--text-primary)] font-bold text-sm">Top Products</h2>
            <Link to="/admin/products" className="font-mono text-[11px] text-[var(--accent-blue)] hover:underline flex items-center gap-1">ALL <Icon name="chevron_right" size={13} /></Link>
          </div>
          <div className="divide-y divide-[var(--border-theme)]">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-surface-tertiary)] transition-colors">
                <span className="font-mono text-xs text-[var(--text-secondary)] w-4">{i + 1}</span>
                <img src={p.image} alt="" className="w-9 h-9 object-cover rounded bg-[var(--bg-surface-tertiary)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[var(--text-primary)] text-[11px] font-semibold truncate">{p.name}</h3>
                  <span className="font-mono text-[10px] text-[var(--text-secondary)]">{p.reviewCount.toLocaleString()} sold</span>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-primary)] font-bold shrink-0">${p.price.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
