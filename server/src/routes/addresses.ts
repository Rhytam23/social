import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { addressService } from '../services/addressService'
import { asyncRoute, success } from '../middleware/errorHandler'
import { validate } from '../middleware/validate'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  street: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  country: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  isDefault: z.boolean().optional(),
})

// GET /api/addresses — Get saved addresses for authenticated user
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const addresses = await addressService.listUserAddresses(req.user!.userId)
    success(res, { addresses })
  })
)

// POST /api/addresses — Add a new address
router.post(
  '/',
  validate(addressSchema),
  asyncRoute(async (req, res) => {
    const address = await addressService.createAddress(req.user!.userId, req.body)
    success(res, { address }, 201)
  })
)

// PUT /api/addresses/:id — Edit an address
router.put(
  '/:id',
  validate(addressSchema.partial()),
  asyncRoute(async (req, res) => {
    const address = await addressService.updateAddress(req.params.id, req.user!.userId, req.body)
    success(res, { address })
  })
)

// DELETE /api/addresses/:id — Delete an address
router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    await addressService.deleteAddress(req.params.id, req.user!.userId)
    success(res, { message: 'Address deleted' })
  })
)

// PUT /api/addresses/:id/default — Set default address
router.put(
  '/:id/default',
  asyncRoute(async (req, res) => {
    const address = await addressService.setDefault(req.params.id, req.user!.userId)
    success(res, { address })
  })
)

export default router
