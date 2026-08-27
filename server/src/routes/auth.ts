import { Router } from 'express'
import { authService } from '../services/authService'
import { oauthService } from '../services/oauthService'
import { authenticate, setAuthCookie, clearAuthCookie, generateToken } from '../middleware/auth'
import { validate, registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema } from '../middleware/validate'
import { asyncRoute, success, created } from '../middleware/errorHandler'
import { config } from '../config'

const router = Router()

// Helper to determine if request is local dev
function isDevRequest(req: any): boolean {
  const host = req.get('host') || ''
  const origin = req.get('origin') || ''
  return host.includes('localhost') || origin.includes('localhost')
}

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  asyncRoute(async (req, res) => {
    const { user, token } = await authService.register(req.body)
    setAuthCookie(res, token)
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
      message: `OTP code generated and sent to ${email}`,
      email: result.email,
      expiresAt: result.expiresAt,
      // Demo code returned for quick local testing when Resend API key is unconfigured
      demoCode: process.env['RESEND_API_KEY'] ? undefined : result.code,
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
    success(res, { user })
  })
)

// ─── OAuth Routes ─────────────────────────────────────────────────────────────

// GET /api/auth/google
router.get(
  '/google',
  asyncRoute(async (req, res) => {
    const state = oauthService.generateState()
    const isDev = isDevRequest(req)
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    })
    const authUrl = oauthService.getGoogleAuthUrl(state, isDev)
    res.redirect(authUrl)
  })
)

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  asyncRoute(async (req, res) => {
    const { code, state, error } = req.query
    const isDev = isDevRequest(req)
    const frontendTarget = isDev ? 'http://localhost:5173' : (config.frontendUrl || config.cors.origin)

    if (error || !code) {
      return res.redirect(`${frontendTarget}/login?error=google_cancelled`)
    }

    const savedState = req.cookies?.oauth_state
    res.clearCookie('oauth_state')

    try {
      const user = await oauthService.handleGoogleCallback(code as string, state as string, savedState, isDev)
      const token = generateToken({ userId: user.id, email: user.email, role: user.role })
      setAuthCookie(res, token)
      res.redirect(`${frontendTarget}/account`)
    } catch (err: any) {
      console.error('[Google OAuth Error]:', err?.message || err)
      const errMsg = encodeURIComponent(err?.message || 'google_failed')
      res.redirect(`${frontendTarget}/login?error=${errMsg}`)
    }
  })
)

// GET /api/auth/github
router.get(
  '/github',
  asyncRoute(async (req, res) => {
    const state = oauthService.generateState()
    const isDev = isDevRequest(req)
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    })
    const authUrl = oauthService.getGitHubAuthUrl(state, isDev)
    res.redirect(authUrl)
  })
)

// GET /api/auth/github/callback
router.get(
  '/github/callback',
  asyncRoute(async (req, res) => {
    const { code, state, error } = req.query
    const isDev = isDevRequest(req)
    const frontendTarget = isDev ? 'http://localhost:5173' : (config.frontendUrl || config.cors.origin)

    if (error || !code) {
      return res.redirect(`${frontendTarget}/login?error=github_cancelled`)
    }

    const savedState = req.cookies?.oauth_state
    res.clearCookie('oauth_state')

    try {
      const user = await oauthService.handleGitHubCallback(code as string, state as string, savedState, isDev)
      const token = generateToken({ userId: user.id, email: user.email, role: user.role })
      setAuthCookie(res, token)
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
