import { Router, Request, Response } from 'express'
import { authService } from '../services/authService'
import { oauthService } from '../services/oauthService'
import { cartService } from '../services/orderService'
import { authenticate, setAuthCookie, clearAuthCookie, generateToken, sessionCookieOptions } from '../middleware/auth'
import { validate, registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema } from '../middleware/validate'
import { asyncRoute, success, created } from '../middleware/errorHandler'
import { config } from '../config'

const router = Router()

// Merge a guest (session) cart into the freshly authenticated user's cart.
// Never blocks the login flow — merge failures are logged and swallowed.
async function mergeGuestCart(req: Request, res: Response, userId: string): Promise<void> {
  const sessionId = req.cookies?.['cart_session']
  if (!sessionId) return
  try {
    await cartService.mergeSessionCartIntoUser(sessionId, userId)
  } catch (err) {
    console.error('[Auth] Guest cart merge failed:', err)
  }
  res.cookie('cart_session', '', { ...sessionCookieOptions(), maxAge: 0 })
}

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  asyncRoute(async (req, res) => {
    const { user, token } = await authService.register(req.body)
    setAuthCookie(res, token)
    await mergeGuestCart(req, res, user.id)
    created(res, { user })
  })
)

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncRoute(async (req, res) => {
    const { email, password } = req.body
    const { user, token } = await authService.login(email, password)
    setAuthCookie(res, token)
    await mergeGuestCart(req, res, user.id)
    success(res, { user })
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
      message: `OTP code sent to ${email}`,
      email: result.email,
      expiresAt: result.expiresAt,
      // The code is exposed ONLY to the integration test suite (NODE_ENV=test).
      ...(config.env === 'test' ? { demoCode: result.code } : {}),
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
    setAuthCookie(res, token)
    await mergeGuestCart(req, res, user.id)
    success(res, { user })
  })
)

// POST /api/auth/reset-password — completes a reset_password OTP flow.
// Does not create a session; the user signs in with the new password.
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncRoute(async (req, res) => {
    const { email, code, newPassword } = req.body
    await authService.resetPasswordWithOtp(email, code, newPassword)
    success(res, { message: 'Password has been reset. Please sign in with your new password.' })
  })
)

// ─── OAuth Routes ─────────────────────────────────────────────────────────────

router.get(
  '/google',
  asyncRoute(async (_req, res) => {
    const state = oauthService.generateState()
    res.cookie('oauth_state', state, {
      ...sessionCookieOptions(),
      maxAge: 10 * 60 * 1000, // 10 minutes
    })
    const authUrl = oauthService.getGoogleAuthUrl(state)
    res.redirect(authUrl)
  })
)

router.get(
  '/google/callback',
  asyncRoute(async (req, res) => {
    const { code, state, error } = req.query
    const frontendTarget = config.frontendUrl

    if (error || !code) {
      return res.redirect(`${frontendTarget}/login?error=google_cancelled`)
    }

    const savedState = req.cookies?.oauth_state
    res.clearCookie('oauth_state')

    try {
      const user = await oauthService.handleGoogleCallback(code as string, state as string, savedState)
      const token = generateToken({ userId: user.id, email: user.email, role: user.role })
      setAuthCookie(res, token)
      await mergeGuestCart(req, res, user.id)
      res.redirect(`${frontendTarget}/account`)
    } catch (err: any) {
      console.error('[Google OAuth Error]:', err?.message || err)
      const errMsg = encodeURIComponent(err?.message || 'google_failed')
      res.redirect(`${frontendTarget}/login?error=${errMsg}`)
    }
  })
)

router.get(
  '/github',
  asyncRoute(async (_req, res) => {
    const state = oauthService.generateState()
    res.cookie('oauth_state', state, {
      ...sessionCookieOptions(),
      maxAge: 10 * 60 * 1000, // 10 minutes
    })
    const authUrl = oauthService.getGitHubAuthUrl(state)
    res.redirect(authUrl)
  })
)

router.get(
  '/github/callback',
  asyncRoute(async (req, res) => {
    const { code, state, error } = req.query
    const frontendTarget = config.frontendUrl

    if (error || !code) {
      return res.redirect(`${frontendTarget}/login?error=github_cancelled`)
    }

    const savedState = req.cookies?.oauth_state
    res.clearCookie('oauth_state')

    try {
      const user = await oauthService.handleGitHubCallback(code as string, state as string, savedState)
      const token = generateToken({ userId: user.id, email: user.email, role: user.role })
      setAuthCookie(res, token)
      await mergeGuestCart(req, res, user.id)
      res.redirect(`${frontendTarget}/account`)
    } catch (err: any) {
      console.error('[GitHub OAuth Error]:', err?.message || err)
      const errMsg = encodeURIComponent(err?.message || 'github_failed')
      res.redirect(`${frontendTarget}/login?error=${errMsg}`)
    }
  })
)

// ─── Session Management ────────────────────────────────────────────────────────

// GET /api/auth/me — requires valid session
router.get(
  '/me',
  authenticate,
  asyncRoute(async (req, res) => {
    const user = await authService.getById(req.user!.userId)
    success(res, { user })
  })
)

// POST /api/auth/logout — clear session cookie
router.post(
  '/logout',
  asyncRoute(async (_req, res) => {
    clearAuthCookie(res)
    success(res, { message: 'Logged out successfully' })
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
