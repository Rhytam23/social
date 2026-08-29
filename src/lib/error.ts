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
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed. Check your connection.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof NetworkError || err instanceof Error) {
    return err.message
  }
  return 'An unexpected error occurred'
}

