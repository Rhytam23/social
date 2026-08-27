import { Router } from 'express'
import { categoryService } from '../services/categoryService'
import { asyncRoute, success } from '../middleware/errorHandler'
import { validate, slugParamSchema } from '../middleware/validate'

const router = Router()

// GET /api/categories
router.get('/', asyncRoute(async (_req, res) => {
  const categories = await categoryService.list(true)
  success(res, { categories })
}))

// GET /api/categories/:slug
router.get('/:slug', validate(slugParamSchema, 'params'), asyncRoute(async (req, res) => {
  const category = await categoryService.getBySlug(req.params.slug)
  success(res, { category })
}))

export default router
