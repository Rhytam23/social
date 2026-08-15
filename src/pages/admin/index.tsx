import { Routes, Route } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AdminDashboard } from './AdminDashboard'
import { AdminProducts } from './AdminProducts'
import { AdminProductEditor } from './AdminProductEditor'
import { AdminOrders } from './AdminOrders'
import { AdminCustomers } from './AdminCustomers'
import { AdminInventory } from './AdminInventory'
import { AdminCategories } from './AdminCategories'
import { AdminPromotions } from './AdminPromotions'
import { AdminAnalytics } from './AdminAnalytics'
import { AdminMedia } from './AdminMedia'
import { AdminSettings } from './AdminSettings'
import { NotFoundPage } from '../NotFoundPage'

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductEditor />} />
        <Route path="products/:id" element={<AdminProductEditor />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
