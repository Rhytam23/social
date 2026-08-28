import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { reviewService } from '../services/reviewService'
import { validate } from '../middleware/validate'
import { asyncRoute, success, created, noContent } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(2).max(150),
  content: z.string().min(5).max(2000),
})

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().min(2).max(150).optional(),
  content: z.string().min(5).max(2000).optional(),
})

// GET /api/products/:id/reviews — public product reviews list
router.get(
  '/products/:id/reviews',
  asyncRoute(async (req, res) => {
    const reviews = await reviewService.getByProductId(req.params.id)
    success(res, { reviews })
  })
)

// POST /api/products/:id/reviews — add review (authenticated)
router.post(
  '/products/:id/reviews',
  authenticate,
  validate(createReviewSchema),
  asyncRoute(async (req, res) => {
    const review = await reviewService.create(req.user!.userId, req.params.id, req.body)
    created(res, { review })
  })
)

// PATCH /api/reviews/:id — update review (authenticated owner)
router.patch(
  '/reviews/:id',
  authenticate,
  validate(updateReviewSchema),
  asyncRoute(async (req, res) => {
    const review = await reviewService.update(req.user!.userId, req.params.id, req.body)
    success(res, { review })
  })
)

// DELETE /api/reviews/:id — delete review (owner or admin)
router.delete(
  '/reviews/:id',
  authenticate,
  asyncRoute(async (req, res) => {
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'manager' || req.user?.role === 'staff'
    await reviewService.delete(req.user!.userId, req.params.id, isAdmin)
    noContent(res)
  })
)

export default router
