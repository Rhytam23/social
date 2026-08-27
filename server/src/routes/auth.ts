import { Router } from 'express'
import { authService } from '../services/authService'
import { authenticate } from '../middleware/auth'
import { validate, registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema } from '../middleware/validate'
import { asyncRoute, success, created } from '../middleware/errorHandler'

const router = Router()

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  asyncRoute(async (req, res) => {
    const { user, token } = await authService.register(req.body)
    created(res, { user, token })
  })
)

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncRoute(async (req, res) => {
    const { email, password } = req.body
    const { user, token } = await authService.login(email, password)
    success(res, { user, token })
  })
)

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  validate(sendOtpSchema),
  asyncRoute(async (req, res) => {
    const { email, purpose } = req.body
    const result = await authService.sendOTP(email, purpose)
    success(res, {
      message: `OTP code generated and sent to ${email}`,
      email: result.email,
      expiresAt: result.expiresAt,
      // Pass code in response for easy testing / demo
      demoCode: result.code,
    })
  })
)

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  asyncRoute(async (req, res) => {
    const { email, code, purpose } = req.body
    const { user, token } = await authService.verifyOTP(email, code, purpose)
    success(res, { user, token })
  })
)

// GET /api/auth/me  — requires valid JWT
router.get(
  '/me',
  authenticate,
  asyncRoute(async (req, res) => {
    const user = await authService.getById(req.user!.userId)
    success(res, { user })
  })
)

// PUT /api/auth/profile
router.put(
  '/profile',
  authenticate,
  asyncRoute(async (req, res) => {
    const { firstName, lastName, phone } = req.body
    const user = await authService.updateProfile(req.user!.userId, { firstName, lastName, phone })
    success(res, { user })
  })
)

// PUT /api/auth/password
router.put(
  '/password',
  authenticate,
  asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    await authService.changePassword(req.user!.userId, currentPassword, newPassword)
    success(res, { message: 'Password updated successfully' })
  })
)

export default router
