import { Request, Response, NextFunction } from 'express'

// ─── Typed API Response ────────────────────────────────────────────────────────

export function success<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data })
}

export function created<T>(res: Response, data: T): Response {
  return success(res, data, 201)
}

export function noContent(res: Response): Response {
  return res.status(204).send()
}

// ─── Typed Error Classes ──────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly errors?: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_ERROR')
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

// ─── Global Error Handler ──────────────────────────────────────────────────────

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && err.errors ? { errors: err.errors } : {}),
      },
    })
    return
  }

  // PostgreSQL unique violation
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const pgErr = err as { code: string; detail?: string }
    if (pgErr.code === '23505') {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'A record with this value already exists.' },
      })
      return
    }
    if (pgErr.code === '23503') {
      res.status(422).json({
        success: false,
        error: { code: 'FOREIGN_KEY', message: 'Referenced record does not exist.' },
      })
      return
    }
  }

  // Generic fallback — do not expose internals
  console.error('[Server Error]', err)
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  })
}

// ─── Async Route Wrapper ──────────────────────────────────────────────────────

export function asyncRoute(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
