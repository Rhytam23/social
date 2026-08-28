import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { LineChart, DonutChart } from '../../components/ui/Charts'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { revenueSeries, categoryRevenue } from '../../data'
import { useShop } from '../../context/ShopContext'
import { apiClient } from '../../services/apiClient'

interface DashboardData {
  recentOrders: any[]
  userCount: number
  productCount: number
  lowStockCount: number
  totalSales: number
}

export function AdminDashboard() {
  const { products, orders, customers } = useShop()
  const [telemetry, setTelemetry] = useState<DashboardData | null>(null)

  useEffect(() => {
    let isMounted = true
    apiClient.get<DashboardData>('/api/admin/dashboard')
      .then((data) => {
        if (isMounted) {
          setTelemetry(data)
        }
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  const topProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5)
  const lowStock = telemetry?.lowStockCount ?? products.filter((p) => p.stockStatus !== 'in-stock').length
  const totalRevenue = telemetry?.totalSales ?? orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalUsers = telemetry?.userCount ?? customers.length
  const totalProds = telemetry?.productCount ?? products.length
  const recentOrdersList = telemetry?.recentOrders ?? orders.slice(0, 6)

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Store performance overview · Real-time storefront telemetry"
        action={
          <Link to="/admin/products" className="px-3.5 py-2 bg-[var(--accent-blue)] text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
            <Icon name="add" size={15} /> MANAGE CATALOG
          </Link>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Sales" value={`$${Math.round(totalRevenue).toLocaleString()}`} icon="payments" color="#16a34a" />
        <StatCard label="Total Orders" value={String(recentOrdersList.length)} icon="receipt_long" color="#0066FF" />
        <StatCard label="Total Customers" value={String(totalUsers)} icon="group" color="#a855f7" />
        <StatCard label="Total Products" value={String(totalProds)} icon="inventory_2" color="#eab308" />
        <StatCard label="Low Stock Items" value={String(lowStock)} icon="warning" color="#ea580c" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[var(--text-primary)] font-bold text-sm">Revenue Trend</h2>
            <span className="font-mono text-xs text-emerald-500 flex items-center gap-1">
              <Icon name="trending_up" size={14} /> Live Telemetry
            </span>
          </div>
          <LineChart data={revenueSeries} format={(v) => `$${Math.round(v / 1000)}k`} />
        </div>
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 flex flex-col justify-between">
          <h2 className="text-[var(--text-primary)] font-bold text-sm mb-4">Revenue by Category</h2>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart data={categoryRevenue} size={180} />
          </div>
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-[var(--text-primary)] font-bold text-sm">Recent Orders</h2>
            <Link to="/admin/orders" className="font-mono text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1 font-bold">
              VIEW ALL <Icon name="chevron_right" size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="font-mono text-[11px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-subtle)]">
                  <th className="text-left p-3.5 font-semibold">Order</th>
                  <th className="text-left p-3.5 font-semibold">Customer</th>
                  <th className="text-right p-3.5 font-semibold">Amount</th>
                  <th className="text-center p-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {recentOrdersList.map((o: any) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="p-3.5 font-mono text-[var(--accent-blue)] font-bold">#{o.id}</td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{o.customerName || o.shippingAddress?.name || 'Customer'}</td>
                    <td className="p-3.5 text-right font-mono text-[var(--text-primary)] font-bold">${(o.total || 0).toFixed(2)}</td>
                    <td className="p-3.5 text-center"><Pill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-[var(--text-primary)] font-bold text-sm">Top Products</h2>
            <Link to="/admin/products" className="font-mono text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1 font-bold">
              ALL <Icon name="chevron_right" size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3.5 hover:bg-[var(--bg-primary)] transition-colors">
                <span className="font-mono text-xs text-[var(--text-secondary)] w-4 font-bold">{i + 1}</span>
                <img src={p.image} alt="" className="w-9 h-9 object-cover rounded bg-[var(--bg-primary)] shrink-0 border border-[var(--border-subtle)]" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[var(--text-primary)] text-xs font-semibold truncate">{p.name}</h3>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">{p.reviewCount.toLocaleString()} sold</span>
                </div>
                <span className="font-mono text-xs text-[var(--text-primary)] font-bold shrink-0">${p.price.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
