import { Router } from 'express'
import { cartService } from '../services/orderService'
import { optionalAuth, sessionCookieOptions } from '../middleware/auth'
import { validate, addToCartSchema, updateCartItemSchema } from '../middleware/validate'
import { asyncRoute, success, noContent } from '../middleware/errorHandler'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'

const router = Router()

function getSessionId(req: import('express').Request): string {
  // Use a stable session cookie for anonymous carts
  let sid = req.cookies?.['cart_session']
  if (!sid) {
    sid = uuid()
    // Response object is available through the route handler
    req.res?.cookie('cart_session', sid, {
      ...sessionCookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
  }
  return sid
}

// GET /api/cart
router.get('/', optionalAuth, asyncRoute(async (req, res) => {
  const userId = req.user?.userId
  const sessionId = userId ? undefined : getSessionId(req)
  const cart = await cartService.getCart(userId, sessionId)
  success(res, { cart })
}))

// POST /api/cart/items
router.post('/items', optionalAuth, validate(addToCartSchema), asyncRoute(async (req, res) => {
  const { productId, quantity } = req.body
  const userId = req.user?.userId
  const sessionId = userId ? undefined : getSessionId(req)
  const cart = await cartService.addItem({ productId, quantity, userId, sessionId })
  success(res, { cart })
}))

// PUT /api/cart/items/:productId
router.put(
  '/items/:productId',
  optionalAuth,
  validate(updateCartItemSchema),
  validate(z.object({ productId: z.string().uuid() }), 'params'),
  asyncRoute(async (req, res) => {
    const { quantity } = req.body
    const userId = req.user?.userId
    const sessionId = userId ? undefined : getSessionId(req)
    const cart = await cartService.updateItem({
      productId: req.params.productId,
      quantity,
      userId,
      sessionId,
    })
    success(res, { cart })
  })
)

// DELETE /api/cart
router.delete('/', optionalAuth, asyncRoute(async (req, res) => {
  const userId = req.user?.userId
  const sessionId = userId ? undefined : getSessionId(req)
  await cartService.clearCart(userId, sessionId)
  noContent(res)
}))

export default router
