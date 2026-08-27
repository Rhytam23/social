import { Router } from 'express'
import { brandService } from '../services/brandService'
import { asyncRoute, success } from '../middleware/errorHandler'

const router = Router()

// GET /api/brands
router.get('/', asyncRoute(async (_req, res) => {
  const brands = await brandService.list(true)
  success(res, { brands })
}))

// GET /api/brands/:slug
router.get('/:slug', asyncRoute(async (req, res) => {
  const brand = await brandService.getBySlug(req.params.slug)
  success(res, { brand })
}))

export default router
