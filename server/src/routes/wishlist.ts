import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { wishlistService } from '../services/wishlistService'
import { asyncRoute, success, noContent } from '../middleware/errorHandler'

const router = Router()

// All wishlist routes require authentication
router.use(authenticate)

// GET /api/wishlist — get user's wishlist products
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const products = await wishlistService.getWishlist(req.user!.userId)
    const productIds = products.map((p) => p.id)
    success(res, { wishlist: products, wishlistIds: productIds })
  })
)

// POST /api/wishlist/:productId — add item to wishlist
router.post(
  '/:productId',
  asyncRoute(async (req, res) => {
    await wishlistService.add(req.user!.userId, req.params.productId)
    const productIds = await wishlistService.getWishlistProductIds(req.user!.userId)
    success(res, { wishlistIds: productIds })
  })
)

// DELETE /api/wishlist/:productId — remove item from wishlist
router.delete(
  '/:productId',
  asyncRoute(async (req, res) => {
    await wishlistService.remove(req.user!.userId, req.params.productId)
    const productIds = await wishlistService.getWishlistProductIds(req.user!.userId)
    success(res, { wishlistIds: productIds })
  })
)

// DELETE /api/wishlist — clear wishlist
router.delete(
  '/',
  asyncRoute(async (req, res) => {
    await wishlistService.clear(req.user!.userId)
    noContent(res)
  })
)

export default router
