import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'
import { ValidationError } from './errorHandler'

// ─── Zod Validation Middleware ────────────────────────────────────────────────

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'root'
        if (!fieldErrors[key]) fieldErrors[key] = []
        fieldErrors[key].push(issue.message)
      }
      throw new ValidationError('Validation failed', fieldErrors)
    }
    // Replace the source with the parsed (coerced + stripped) data
    req[source] = result.data
    next()
  }
}

// ─── Reusable Schemas ─────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
})

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(30).optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  purpose: z.enum(['login', 'register', 'reset_password']).default('login'),
})

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  code: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  purpose: z.enum(['login', 'register']).default('login'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  code: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
})

// ─── Product Schemas ──────────────────────────────────────────────────────────

export const productListSchema = paginationSchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  // Comma-separated product UUIDs — used to hydrate compare/wishlist selections.
  ids: z.string()
    .max(2000)
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined))
    .refine(
      (arr) => !arr || arr.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
      { message: 'ids must be a comma-separated list of UUIDs' }
    ),
  search: z.string().max(200).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isFeatured: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isNew: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  hasDiscount: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating_desc', 'name_asc', 'newest', 'featured']).optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/).optional(),
  sku: z.string().min(1).max(100).trim(),
  description: z.string().max(10000).optional(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  price: z.number().min(0).max(1_000_000),
  previousPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  wattage: z.number().int().min(0).optional(),
  weightGrams: z.number().int().min(0).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
  specs: z.array(z.object({
    label: z.string().min(1).max(200),
    value: z.string().min(1).max(500),
  })).optional(),
  tags: z.array(z.string().max(50)).optional(),
  inventory: z.object({
    quantityOnHand: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    supplier: z.string().optional(),
  }).optional(),
})

export const updateProductSchema = createProductSchema.partial()

// ─── Admin Schemas ────────────────────────────────────────────────────────────

// paginationSchema strips unknown query keys, so admin list filters must be
// declared explicitly or they silently never reach the service.
export const adminOrderListSchema = paginationSchema.extend({
  status: z.enum(['processing', 'assembling', 'quality_check', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
})

export const adminUserListSchema = paginationSchema.extend({
  role: z.enum(['customer', 'admin', 'staff', 'manager']).optional(),
})

export const categoryBodySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
})

export const categoryUpdateSchema = categoryBodySchema.partial()

export const brandBodySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const brandUpdateSchema = brandBodySchema.partial()

export const inventoryAdjustSchema = z.object({
  quantityOnHand: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  supplier: z.string().max(200).optional(),
  restockEta: z.string().max(100).optional(),
})

export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid ID format'),
})

// ─── Cart Schemas ──────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
})

// ─── Order Schemas ────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1, 'Order must have at least one item'),
  shippingName: z.string().min(1).max(200).trim(),
  shippingStreet: z.string().min(1).max(500).trim(),
  shippingCity: z.string().min(1).max(200).trim(),
  shippingState: z.string().min(1).max(100).trim(),
  shippingZip: z.string().min(1).max(20).trim(),
  shippingCountry: z.string().min(1).max(100).trim(),
  shippingMethod: z.enum(['standard', 'express']),
  paymentMethod: z.enum(['card', 'paypal', 'crypto']),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(30).optional(),
})
