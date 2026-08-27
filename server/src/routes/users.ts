import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { authService } from '../services/authService'
import { asyncRoute, success } from '../middleware/errorHandler'
import { validate } from '../middleware/validate'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

// GET /api/users/me — profile of current authenticated user
router.get(
  '/me',
  asyncRoute(async (req, res) => {
    const user = await authService.getById(req.user!.userId)
    success(res, { user })
  })
)

// PATCH /api/users/me — update current user profile
router.patch(
  '/me',
  validate(
    z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      phone: z.string().max(20).optional(),
    })
  ),
  asyncRoute(async (req, res) => {
    const user = await authService.updateProfile(req.user!.userId, req.body)
    success(res, { user })
  })
)

export default router
