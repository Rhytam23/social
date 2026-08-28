import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { AuthError, ForbiddenError } from './errorHandler'
import type { JwtPayload, UserRole } from '../types'

// Augment Express Request to carry the decoded JWT
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// ─── JWT Verify Middleware (Cookie Primary, Header Secondary) ─────────────────

export function extractToken(req: Request): string | null {
  // 1. Primary: HTTP-Only Session Cookie
  if (req.cookies?.token) {
    return req.cookies.token
  }
  // 2. Secondary: Bearer Authorization Header
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return null
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req)
  if (!token) {
    throw new AuthError('Authentication session token required')
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.user = payload
    next()
  } catch {
    throw new AuthError('Invalid or expired authentication session')
  }
}

// ─── Optional Auth (sets req.user if token present, does not reject) ──────────

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req)
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
      req.user = payload
    } catch {
      // Token present but invalid — treat as anonymous
    }
  }
  next()
}

// ─── Cookie Helpers ────────────────────────────────────────────────────────────

// Shared cookie flags for every session-bearing cookie (auth, cart session, oauth state).
// In production the SPA (Vercel) and the API (Render) live on different sites, so cookies
// must be SameSite=None; Secure to be attached to fetch(credentials:'include') requests.
// Set CROSS_SITE_COOKIES=false for a same-site production deployment.
export function sessionCookieOptions(): {
  httpOnly: true
  secure: boolean
  sameSite: 'lax' | 'none'
  path: '/'
} {
  const isProduction = config.env === 'production'
  const crossSite = isProduction && process.env['CROSS_SITE_COOKIES'] !== 'false'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    ...sessionCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

export function clearAuthCookie(res: Response): void {
  res.cookie('token', '', {
    ...sessionCookieOptions(),
    maxAge: 0,
  })
}

// ─── Role Guard ───────────────────────────────────────────────────────────────

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AuthError()
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Role '${req.user.role}' is not authorized for this action`)
    }
    next()
  }
}

export const requireAdmin = requireRole('admin', 'manager')
export const requireStaff = requireRole('admin', 'manager', 'staff')

// ─── Token Generator ──────────────────────────────────────────────────────────

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  })
}
