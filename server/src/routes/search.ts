import { Router } from 'express'
import { searchService } from '../services/searchService'
import { validate, productListSchema } from '../middleware/validate'
import { asyncRoute, success } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()

// GET /api/search?q=rtx+4090&category=gpus&page=1
router.get(
  '/',
  validate(productListSchema, 'query'),
  asyncRoute(async (req, res) => {
    const result = await searchService.searchProducts((req.query as unknown) as Parameters<typeof searchService.searchProducts>[0])
    success(res, result)
  })
)

// GET /api/search/suggest?q=rtx
router.get(
  '/suggest',
  validate(z.object({ q: z.string().min(1).max(100) }), 'query'),
  asyncRoute(async (req, res) => {
    const suggestions = await searchService.suggest(req.query.q as string)
    success(res, { suggestions })
  })
)

export default router
