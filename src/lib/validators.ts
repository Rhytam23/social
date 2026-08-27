// ─── Client-side input validators ─────────────────────────────────────────────
// Used to provide immediate feedback before the server validates.
// Server validation is still authoritative — these are UX helpers only.

export const validators = {
  email: (v: string): string | null => {
    if (!v.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email address'
    return null
  },

  password: (v: string): string | null => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'Password must be at least 8 characters'
    if (v.length > 128) return 'Password is too long'
    return null
  },

  required: (label: string) => (v: string): string | null => {
    if (!v.trim()) return `${label} is required`
    return null
  },

  maxLength: (label: string, max: number) => (v: string): string | null => {
    if (v.length > max) return `${label} must be ${max} characters or fewer`
    return null
  },

  price: (v: number | string): string | null => {
    const n = typeof v === 'string' ? parseFloat(v) : v
    if (isNaN(n)) return 'Price must be a number'
    if (n < 0) return 'Price cannot be negative'
    if (n > 1_000_000) return 'Price exceeds maximum'
    return null
  },

  quantity: (v: number): string | null => {
    if (!Number.isInteger(v)) return 'Quantity must be a whole number'
    if (v < 1) return 'Quantity must be at least 1'
    if (v > 99) return 'Maximum quantity is 99'
    return null
  },

  phone: (v: string): string | null => {
    if (!v.trim()) return null // optional
    if (v.length > 30) return 'Phone number too long'
    return null
  },

  zip: (v: string): string | null => {
    if (!v.trim()) return 'ZIP/Postal code is required'
    if (v.length > 20) return 'Invalid postal code'
    return null
  },
}

export type Validator = (v: string) => string | null

export function runValidators(value: string, ...fns: Validator[]): string | null {
  for (const fn of fns) {
    const err = fn(value)
    if (err) return err
  }
  return null
}
