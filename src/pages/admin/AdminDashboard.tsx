import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { LineChart, DonutChart } from '../../components/ui/Charts'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { revenueSeries, categoryRevenue, adminOrders, allProducts, adminCustomers } from '../../data'

export function AdminDashboard() {
  const topProducts = [...allProducts].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5)
  const lowStock = allProducts.filter((p) => p.stockStatus !== 'in-stock').length

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Store performance overview · Last 30 days"
        action={
          <Link to="/admin/analytics" className="px-3.5 py-2 bg-[#1a1b1f] border border-[#414755] hover:border-white text-white font-mono text-xs rounded flex items-center gap-1.5 transition-colors">
            <Icon name="monitoring" size={15} /> FULL ANALYTICS
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard label="Revenue" value="$468K" delta="11.2%" deltaUp icon="payments" color="#30d158" />
        <StatCard label="Orders" value="2,010" delta="8.4%" deltaUp icon="receipt_long" color="#007aff" />
        <StatCard label="Customers" value={String(adminCustomers.length * 154)} delta="5.1%" deltaUp icon="group" color="#bf5af2" />
        <StatCard label="Products" value={String(allProducts.length)} icon="inventory_2" color="#ffd60a" />
        <StatCard label="Low Stock" value={String(lowStock)} delta="2 items" icon="warning" color="#ff5c00" />
        <StatCard label="Conversion" value="3.8%" delta="0.3%" deltaUp icon="conversion_path" color="#5ac8fa" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-[#1a1b1f] border border-[#414755] rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">Revenue Trend</h2>
            <span className="font-mono text-[10px] text-[#30d158] flex items-center gap-1"><Icon name="trending_up" size={13} /> +11.2% MoM</span>
          </div>
          <LineChart data={revenueSeries} format={(v) => `$${Math.round(v / 1000)}k`} />
        </div>
        <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
          <h2 className="text-white font-bold text-sm mb-4">Revenue by Category</h2>
          <DonutChart data={categoryRevenue} size={180} />
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#292a2e]">
            <h2 className="text-white font-bold text-sm">Recent Orders</h2>
            <Link to="/admin/orders" className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1">VIEW ALL <Icon name="chevron_right" size={13} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
                  <th className="text-left p-3 font-semibold">Order</th>
                  <th className="text-left p-3 font-semibold">Customer</th>
                  <th className="text-right p-3 font-semibold">Amount</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292a2e]">
                {adminOrders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-[#1e1f23]">
                    <td className="p-3 font-mono text-[#007aff] font-bold">{o.id}</td>
                    <td className="p-3 text-[#c1c6d7]">{o.customer}</td>
                    <td className="p-3 text-right font-mono text-white font-bold">${o.amount.toFixed(2)}</td>
                    <td className="p-3 text-center"><Pill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#292a2e]">
            <h2 className="text-white font-bold text-sm">Top Products</h2>
            <Link to="/admin/products" className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1">ALL <Icon name="chevron_right" size={13} /></Link>
          </div>
          <div className="divide-y divide-[#292a2e]">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <span className="font-mono text-xs text-[#8b90a0] w-4">{i + 1}</span>
                <img src={p.image} alt="" className="w-9 h-9 object-cover rounded bg-[#0d0e12] shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-white text-[11px] font-semibold truncate">{p.name}</h3>
                  <span className="font-mono text-[10px] text-[#8b90a0]">{p.reviewCount.toLocaleString()} sold</span>
                </div>
                <span className="font-mono text-[11px] text-white font-bold shrink-0">${p.price.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
