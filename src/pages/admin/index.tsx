import { Routes, Route } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AdminDashboard } from './AdminDashboard'
import { AdminProducts } from './AdminProducts'
import { AdminProductEditor } from './AdminProductEditor'
import { AdminOrders } from './AdminOrders'
import { AdminCustomers } from './AdminCustomers'
import { AdminInventory } from './AdminInventory'
import { AdminCategories } from './AdminCategories'
import { AdminBrands } from './AdminBrands'
import { NotFoundPage } from '../NotFoundPage'

// Sections without a backend (promotions/coupons, media library, store
// settings, hero campaign editor, and the previously hardcoded analytics page)
// have been removed rather than shown with fabricated data.
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
        <Route path="brands" element={<AdminBrands />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
