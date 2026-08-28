import { Router } from 'express'
import { authenticate, requireAdmin, requireStaff } from '../../middleware/auth'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { brandService } from '../../services/brandService'
import { inventoryService } from '../../services/inventoryService'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import {
  validate, createProductSchema, updateProductSchema, paginationSchema,
  adminOrderListSchema, adminUserListSchema,
  categoryBodySchema, categoryUpdateSchema, brandBodySchema, brandUpdateSchema,
  inventoryAdjustSchema, uuidParamSchema, productIdParamSchema,
} from '../../middleware/validate'
import { asyncRoute, success, created, noContent } from '../../middleware/errorHandler'
import { query } from '../../db/client'
import { z } from 'zod'

const router = Router()

// All admin routes require authentication + admin/staff role
router.use(authenticate)

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get('/dashboard', requireStaff, asyncRoute(async (_req, res) => {
  const [
    { orders: recentOrders },
    { total: userCount },
    { pagination: { total: productCount } },
    lowStockRecords,
    revenueRows,
    statusRows,
  ] = await Promise.all([
    orderService.listAll({ page: 1, limit: 6 }),
    authService.listUsers({ page: 1, limit: 1 }),
    productService.list({ page: 1, limit: 1 }),
    inventoryService.listLowStock(),
    // Revenue counts only orders that were actually paid.
    query<{ paid_revenue: string; paid_orders: string }>(
      `SELECT COALESCE(SUM(total), 0) AS paid_revenue, COUNT(*) AS paid_orders
       FROM orders WHERE payment_status = 'paid'`
    ),
    query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY status'
    ),
  ])

  const ordersByStatus = statusRows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) }))
  const pendingOrderCount = ordersByStatus
    .filter((s) => s.status === 'processing' || s.status === 'assembling' || s.status === 'quality_check')
    .reduce((sum, s) => sum + s.count, 0)

  success(res, {
    recentOrders,
    userCount,
    productCount,
    lowStockCount: lowStockRecords.length,
    paidRevenue: parseFloat(revenueRows[0]?.paid_revenue ?? '0'),
    paidOrderCount: parseInt(revenueRows[0]?.paid_orders ?? '0', 10),
    pendingOrderCount,
    ordersByStatus,
  })
}))

// ─── Products ─────────────────────────────────────────────────────────────────

router.get('/products', requireStaff, validate(paginationSchema, 'query'), asyncRoute(async (req, res) => {
  const { page, limit } = (req.query as unknown) as { page: number; limit: number }
  const result = await productService.list({ page, limit })
  success(res, result)
}))

router.post('/products', requireAdmin, validate(createProductSchema), asyncRoute(async (req, res) => {
  const product = await productService.create(req.body)
  created(res, { product })
}))

router.post('/products/bulk-import', requireAdmin, validate(z.object({
  items: z.array(z.object({
    name: z.string(),
    sku: z.string(),
    categorySlug: z.string().optional(),
    brandSlug: z.string().optional(),
    price: z.number(),
    previousPrice: z.number().optional(),
    costPrice: z.number().optional(),
    discountPercent: z.number().optional(),
    stockQuantity: z.number().optional(),
    description: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    imageUrl: z.string().optional(),
  }))
})), asyncRoute(async (req, res) => {
  const result = await productService.bulkImport(req.body.items)
  success(res, result)
}))

router.put('/products/:id', requireAdmin, validate(uuidParamSchema, 'params'), validate(updateProductSchema), asyncRoute(async (req, res) => {
  const product = await productService.update(req.params.id, req.body)
  success(res, { product })
}))

router.delete('/products/:id', requireAdmin, validate(uuidParamSchema, 'params'), asyncRoute(async (req, res) => {
  await productService.delete(req.params.id)
  noContent(res)
}))

// ─── Categories ───────────────────────────────────────────────────────────────

router.get('/categories', requireStaff, asyncRoute(async (_req, res) => {
  const categories = await categoryService.list(false) // include hidden
  success(res, { categories })
}))

router.post('/categories', requireAdmin, validate(categoryBodySchema), asyncRoute(async (req, res) => {
  const category = await categoryService.create(req.body)
  created(res, { category })
}))

router.put('/categories/:id', requireAdmin, validate(uuidParamSchema, 'params'), validate(categoryUpdateSchema), asyncRoute(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body)
  success(res, { category })
}))

router.delete('/categories/:id', requireAdmin, validate(uuidParamSchema, 'params'), asyncRoute(async (req, res) => {
  await categoryService.delete(req.params.id)
  noContent(res)
}))

// ─── Brands ───────────────────────────────────────────────────────────────────

router.get('/brands', requireStaff, asyncRoute(async (_req, res) => {
  const brands = await brandService.list(false)
  success(res, { brands })
}))

router.post('/brands', requireAdmin, validate(brandBodySchema), asyncRoute(async (req, res) => {
  const brand = await brandService.create(req.body)
  created(res, { brand })
}))

router.put('/brands/:id', requireAdmin, validate(uuidParamSchema, 'params'), validate(brandUpdateSchema), asyncRoute(async (req, res) => {
  const brand = await brandService.update(req.params.id, req.body)
  success(res, { brand })
}))

router.delete('/brands/:id', requireAdmin, validate(uuidParamSchema, 'params'), asyncRoute(async (req, res) => {
  await brandService.delete(req.params.id)
  noContent(res)
}))

// ─── Inventory ────────────────────────────────────────────────────────────────

router.get('/inventory/low-stock', requireStaff, asyncRoute(async (_req, res) => {
  const records = await inventoryService.listLowStock()
  success(res, { records })
}))

router.get('/inventory/:productId', requireStaff, validate(productIdParamSchema, 'params'), asyncRoute(async (req, res) => {
  const record = await inventoryService.getByProductId(req.params.productId)
  success(res, { record })
}))

router.put('/inventory/:productId', requireAdmin, validate(productIdParamSchema, 'params'), validate(inventoryAdjustSchema), asyncRoute(async (req, res) => {
  const record = await inventoryService.adjust(req.params.productId, req.body)
  success(res, { record })
}))

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get('/orders', requireStaff, validate(adminOrderListSchema, 'query'), asyncRoute(async (req, res) => {
  const q = (req.query as unknown) as { page: number; limit: number; status?: string }
  const result = await orderService.listAll({ page: q.page, limit: q.limit, status: q.status })
  success(res, result)
}))

router.get('/orders/:id', requireStaff, validate(uuidParamSchema, 'params'), asyncRoute(async (req, res) => {
  const order = await orderService.getById(req.params.id, { bypassOwnership: true })
  success(res, { order })
}))

router.put('/orders/:id/status', requireStaff, validate(uuidParamSchema, 'params'), validate(z.object({
  status: z.enum(['processing','assembling','quality_check','shipped','delivered','cancelled','refunded']),
  description: z.string().optional(),
})), asyncRoute(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status, req.body.description)
  success(res, { order })
}))

router.put('/orders/:id/payment-status', requireAdmin, validate(uuidParamSchema, 'params'), validate(z.object({
  paymentStatus: z.enum(['pending','paid','failed','refunded']),
})), asyncRoute(async (req, res) => {
  const order = await orderService.updatePaymentStatus(req.params.id, req.body.paymentStatus)
  success(res, { order })
}))

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', requireAdmin, validate(adminUserListSchema, 'query'), asyncRoute(async (req, res) => {
  const q = (req.query as unknown) as { page: number; limit: number; role?: string }
  const result = await authService.listUsers({ page: q.page, limit: q.limit, role: q.role })
  success(res, result)
}))

router.put('/users/:id/status', requireAdmin, validate(uuidParamSchema, 'params'), validate(z.object({
  status: z.enum(['active','suspended','deleted']),
})), asyncRoute(async (req, res) => {
  const user = await authService.updateUserStatus(req.params.id, req.body.status)
  success(res, { user })
}))

router.put('/users/:id/role', requireAdmin, validate(uuidParamSchema, 'params'), validate(z.object({
  role: z.enum(['customer','admin','staff','manager']),
})), asyncRoute(async (req, res) => {
  const user = await authService.updateUserRole(req.params.id, req.body.role)
  success(res, { user })
}))

export default router
