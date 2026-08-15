import { Icon } from '../../components/ui'
import { LineChart, BarChart, DonutChart } from '../../components/ui/Charts'
import { AdminPageHeader, StatCard } from './AdminLayout'
import { revenueSeries, ordersSeries, categoryRevenue, allProducts } from '../../data'

export function AdminAnalytics() {
  const topProducts = [...allProducts].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6)
  const maxReviews = Math.max(...topProducts.map((p) => p.reviewCount))

  const categoryPerf = [
    { name: 'Graphics Cards', revenue: 196560, orders: 842, share: 42 },
    { name: 'Gaming PCs', revenue: 112320, orders: 96, share: 24 },
    { name: 'CPUs', revenue: 65520, orders: 410, share: 14 },
    { name: 'Monitors', revenue: 42120, orders: 198, share: 9 },
    { name: 'Storage', revenue: 28080, orders: 620, share: 6 },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        subtitle="Deep-dive performance metrics · Last 7 months"
        action={
          <button className="px-3.5 py-2 bg-[#1a1b1f] border border-[#414755] hover:border-white text-white font-mono text-xs rounded flex items-center gap-1.5 transition-colors">
            <Icon name="download" size={15} /> EXPORT REPORT
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Revenue" value="$2.53M" delta="11.2%" deltaUp icon="payments" color="#30d158" />
        <StatCard label="Orders" value="11,950" delta="8.4%" deltaUp icon="receipt_long" color="#007aff" />
        <StatCard label="Avg Order Value" value="$211" delta="2.6%" deltaUp icon="shopping_bag" color="#ffd60a" />
        <StatCard label="Customers" value="1,232" delta="5.1%" deltaUp icon="group" color="#bf5af2" />
        <StatCard label="Conversion" value="3.8%" delta="0.4%" deltaUp icon="conversion_path" color="#5ac8fa" />
      </div>

      {/* Revenue + Orders charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
          <h2 className="text-white font-bold text-sm mb-4">Revenue Trend</h2>
          <LineChart data={revenueSeries} color="#30d158" format={(v) => `$${Math.round(v / 1000)}k`} />
        </div>
        <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
          <h2 className="text-white font-bold text-sm mb-4">Orders per Month</h2>
          <BarChart data={ordersSeries} color="#007aff" />
        </div>
      </div>

      {/* Category perf + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden">
          <div className="p-4 border-b border-[#292a2e]"><h2 className="text-white font-bold text-sm">Category Performance</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-right p-3 font-semibold">Revenue</th>
                  <th className="text-right p-3 font-semibold">Orders</th>
                  <th className="text-left p-3 font-semibold w-1/3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292a2e]">
                {categoryPerf.map((c) => (
                  <tr key={c.name} className="hover:bg-[#1e1f23]">
                    <td className="p-3 text-white font-semibold">{c.name}</td>
                    <td className="p-3 text-right font-mono text-white">${(c.revenue / 1000).toFixed(0)}k</td>
                    <td className="p-3 text-right font-mono text-[#c1c6d7]">{c.orders}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#121317] rounded overflow-hidden"><div className="h-full bg-[#007aff]" style={{ width: `${c.share * 2}%` }} /></div>
                        <span className="font-mono text-[10px] text-[#8b90a0] w-8 text-right">{c.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
          <h2 className="text-white font-bold text-sm mb-4">Revenue Split</h2>
          <DonutChart data={categoryRevenue} size={180} />
        </div>
      </div>

      {/* Top products */}
      <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden">
        <div className="p-4 border-b border-[#292a2e]"><h2 className="text-white font-bold text-sm">Top Product Performance</h2></div>
        <div className="divide-y divide-[#292a2e]">
          {topProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <img src={p.image} alt="" className="w-10 h-10 object-cover rounded bg-[#0d0e12] shrink-0" />
              <div className="min-w-0 w-40 sm:w-56">
                <h3 className="text-white text-xs font-semibold truncate">{p.name}</h3>
                <span className="font-mono text-[10px] text-[#8b90a0]">{p.category}</span>
              </div>
              <div className="flex-1 h-2 bg-[#121317] rounded overflow-hidden hidden sm:block">
                <div className="h-full bg-[#30d158]" style={{ width: `${(p.reviewCount / maxReviews) * 100}%` }} />
              </div>
              <span className="font-mono text-xs text-white font-bold shrink-0 w-20 text-right">{p.reviewCount.toLocaleString()} sold</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
