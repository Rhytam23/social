// ─── Typed Error Classes (Frontend) ──────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isNotFound(): boolean { return this.statusCode === 404 }
  get isUnauthorized(): boolean { return this.statusCode === 401 }
  get isForbidden(): boolean { return this.statusCode === 403 }
  get isValidation(): boolean { return this.statusCode === 422 }
  get isConflict(): boolean { return this.statusCode === 409 }
  get isServerError(): boolean { return this.statusCode >= 500 }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed. Check your connection.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

export function isNetworkError(err: unknown): err is NetworkError {
  return err instanceof NetworkError
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof NetworkError) return err.message
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}
