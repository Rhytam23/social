import { Router } from 'express'
import { productService } from '../services/productService'
import { optionalAuth } from '../middleware/auth'
import { validate, productListSchema, slugParamSchema } from '../middleware/validate'
import { asyncRoute, success } from '../middleware/errorHandler'

const router = Router()

// GET /api/products?page=1&limit=24&category=gpus&brand=nvidia&sort=price_asc
router.get(
  '/',
  validate(productListSchema, 'query'),
  asyncRoute(async (req, res) => {
    const result = await productService.list((req.query as unknown) as Parameters<typeof productService.list>[0])
    success(res, result)
  })
)

// GET /api/products/:slug
router.get(
  '/:slug',
  optionalAuth,
  validate(slugParamSchema, 'params'),
  asyncRoute(async (req, res) => {
    const product = await productService.getBySlug(req.params.slug)
    success(res, { product })
  })
)

export default router
