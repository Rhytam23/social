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

// ─── Product Schemas ──────────────────────────────────────────────────────────

export const productListSchema = paginationSchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().max(200).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isFeatured: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isNew: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
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
