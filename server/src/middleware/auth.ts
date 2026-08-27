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

// ─── JWT Verify Middleware ────────────────────────────────────────────────────

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AuthError('Bearer token required')
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.user = payload
    next()
  } catch {
    throw new AuthError('Invalid or expired token')
  }
}

// ─── Optional Auth (sets req.user if token present, does not reject) ──────────

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), config.jwt.secret) as JwtPayload
      req.user = payload
    } catch {
      // Token present but invalid — treat as anonymous
    }
  }
  next()
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
