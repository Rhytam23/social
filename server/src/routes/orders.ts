import { Router } from 'express'
import { orderService } from '../services/orderService'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validate, createOrderSchema, paginationSchema } from '../middleware/validate'
import { asyncRoute, success, created } from '../middleware/errorHandler'

const router = Router()

// POST /api/orders — create order (auth optional — guest checkout allowed)
router.post(
  '/',
  optionalAuth,
  validate(createOrderSchema),
  asyncRoute(async (req, res) => {
    const order = await orderService.create(req.body, req.user?.userId)
    created(res, { order })
  })
)

// GET /api/orders — list authenticated user's orders
router.get(
  '/',
  authenticate,
  validate(paginationSchema, 'query'),
  asyncRoute(async (req, res) => {
    const { page, limit } = (req.query as unknown) as { page: number; limit: number }
    const result = await orderService.listForUser(req.user!.userId, { page, limit })
    success(res, result)
  })
)

// GET /api/orders/:id — get specific order.
// Orders owned by a user are only visible to that user; guest orders are
// retrievable by anyone holding the order UUID (capability token).
router.get(
  '/:id',
  optionalAuth,
  asyncRoute(async (req, res) => {
    const order = await orderService.getById(req.params.id, { userId: req.user?.userId })
    success(res, { order })
  })
)

// GET /api/orders/track/:orderNumber — public order tracking
router.get(
  '/track/:orderNumber',
  asyncRoute(async (req, res) => {
    const order = await orderService.getByOrderNumber(req.params.orderNumber)
    // Return limited fields for public tracking
    success(res, {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
        trackingNumber: order.trackingNumber,
        timeline: order.timeline,
      }
    })
  })
)

export default router
