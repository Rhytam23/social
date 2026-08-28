// ─── Frontend App Config ──────────────────────────────────────────────────────
// Typed, centralized — no import.meta.env scattered in components.

export const config = {
  api: {
    baseUrl: (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001',
    timeout: parseInt((import.meta.env['VITE_API_TIMEOUT'] as string | undefined) ?? '10000', 10),
  },
  app: {
    title: (import.meta.env['VITE_APP_TITLE'] as string | undefined) ?? 'PREMIUM PC',
    defaultPageSize: parseInt((import.meta.env['VITE_DEFAULT_PAGE_SIZE'] as string | undefined) ?? '24', 10),
    maxCompareItems: parseInt((import.meta.env['VITE_MAX_COMPARE_ITEMS'] as string | undefined) ?? '4', 10),
    freeShippingThreshold: parseFloat((import.meta.env['VITE_FREE_SHIPPING_THRESHOLD'] as string | undefined) ?? '500'),
  },
  stripe: {
    // Publishable key. When empty, checkout shows an explicit
    // "payment not configured" state instead of a fake payment form.
    publishableKey: (import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] as string | undefined) ?? '',
  },
} as const
