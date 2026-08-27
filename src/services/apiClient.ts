import { config } from '../lib/config'
import { ApiError, NetworkError } from '../lib/error'

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'premium_pc_token'

export const tokenStore = {
  get: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set: (token: string): void => {
    try { localStorage.setItem(TOKEN_KEY, token) } catch {}
  },
  clear: (): void => {
    try { localStorage.removeItem(TOKEN_KEY) } catch {}
  },
}

// ─── API Response shape ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; errors?: Record<string, string[]> }
}

// ─── Core HTTP Client ─────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: { signal?: AbortSignal; auth?: boolean } = {}
): Promise<T> {
  const { auth = true } = options
  const url = `${config.api.baseUrl}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'include', // send cookies (cart session)
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal,
    })
  } catch (err) {
    throw new NetworkError(err instanceof Error ? err.message : 'Network request failed')
  }

  let json: ApiResponse<T>
  try {
    json = await response.json()
  } catch {
    throw new ApiError('Invalid server response', response.status, 'INVALID_RESPONSE')
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.message ?? `HTTP ${response.status}`,
      response.status,
      json.error?.code ?? 'UNKNOWN',
      json.error?.errors
    )
  }

  return json.data as T
}

// ─── HTTP method helpers ──────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, options?: { signal?: AbortSignal; auth?: boolean }) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: { signal?: AbortSignal; auth?: boolean }) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: { signal?: AbortSignal; auth?: boolean }) =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: { signal?: AbortSignal; auth?: boolean }) =>
    request<T>('DELETE', path, undefined, options),

  patch: <T>(path: string, body?: unknown, options?: { signal?: AbortSignal; auth?: boolean }) =>
    request<T>('PATCH', path, body, options),
}
