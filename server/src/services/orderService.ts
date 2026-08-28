import { PoolClient } from 'pg'
import { query, queryOne, withTransaction } from '../db/client'
import { NotFoundError, AppError } from '../middleware/errorHandler'
import { config } from '../config'
import { emailService } from './emailService'
import type { Cart, CartItem, Order, OrderLineItem, OrderTimelineEntry, CreateOrderDTO } from '../types'

// ─── Cart Service ─────────────────────────────────────────────────────────────

interface CartRow {
  id: string
  user_id: string | null
  session_id: string | null
}

interface CartItemRow {
  id: string
  cart_id: string
  product_id: string
  product_name: string
  product_slug: string
  primary_image: string | null
  sku: string
  price: string
  quantity: number
  stock_status: string
  stock_available: string
}

function toCartItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    productImage: row.primary_image,
    sku: row.sku,
    price: parseFloat(row.price),
    quantity: row.quantity,
    stockStatus: row.stock_status as CartItem['stockStatus'],
    stockAvailable: parseInt(row.stock_available ?? '0', 10),
  }
}

async function findOrCreateCart(userId?: string, sessionId?: string): Promise<string> {
  const lookup = userId
    ? await queryOne<CartRow>('SELECT * FROM carts WHERE user_id = $1', [userId])
    : await queryOne<CartRow>('SELECT * FROM carts WHERE session_id = $1', [sessionId])

  if (lookup) return lookup.id

  const rows = await query<CartRow>(
    'INSERT INTO carts (user_id, session_id) VALUES ($1, $2) RETURNING *',
    [userId ?? null, sessionId ?? null]
  )
  return rows[0]?.id ?? (sessionId || 'guest-cart-id')
}

const CART_ITEMS_QUERY = `
  SELECT
    ci.id, ci.cart_id, ci.product_id, ci.quantity,
    p.name  AS product_name,
    p.slug  AS product_slug,
    p.sku,
    p.price,
    (SELECT url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image,
    COALESCE(ivs.stock_status, 'out-of-stock') AS stock_status,
    COALESCE(ivs.quantity_available, 0)         AS stock_available
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  LEFT JOIN inventory_status ivs ON ivs.product_id = ci.product_id
  WHERE ci.cart_id = $1
  ORDER BY ci.added_at DESC
`

export const cartService = {
  async getCart(userId?: string, sessionId?: string): Promise<Cart> {
    const cartId = await findOrCreateCart(userId, sessionId)
    const items = await query<CartItemRow>(CART_ITEMS_QUERY, [cartId])
    const cartItems = items.map(toCartItem)
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return {
      id: cartId,
      items: cartItems,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
    }
  },

  async addItem(params: {
    productId: string
    quantity: number
    userId?: string
    sessionId?: string
  }): Promise<Cart> {
    const { productId, quantity, userId, sessionId } = params
    const cartId = await findOrCreateCart(userId, sessionId)

    // Check product exists and is active
    const product = await queryOne<{ id: string }>(
      'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
      [productId]
    )
    if (!product) throw new NotFoundError('Product')

    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [cartId, productId, quantity]
    )

    return this.getCart(userId, sessionId)
  },

  async updateItem(params: {
    productId: string
    quantity: number
    userId?: string
    sessionId?: string
  }): Promise<Cart> {
    const { productId, quantity, userId, sessionId } = params
    const cartId = await findOrCreateCart(userId, sessionId)

    if (quantity <= 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId])
    } else {
      await query(
        'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
        [quantity, cartId, productId]
      )
    }

    return this.getCart(userId, sessionId)
  },

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const cartId = await findOrCreateCart(userId, sessionId)
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId])
  },

  // Moves a guest (session) cart into the user's cart on login/registration.
  // Quantities are combined, capped at the 99-per-item schema limit.
  async mergeSessionCartIntoUser(sessionId: string, userId: string): Promise<void> {
    const sessionCart = await queryOne<CartRow>('SELECT * FROM carts WHERE session_id = $1', [sessionId])
    if (!sessionCart) return

    const userCartId = await findOrCreateCart(userId, undefined)
    if (sessionCart.id === userCartId) return

    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       SELECT $1, product_id, quantity FROM cart_items WHERE cart_id = $2
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = LEAST(99, cart_items.quantity + EXCLUDED.quantity)`,
      [userCartId, sessionCart.id]
    )
    await query('DELETE FROM carts WHERE id = $1', [sessionCart.id])
  },
}

// ─── Order Service ─────────────────────────────────────────────────────────────

interface OrderRow {
  id: string
  order_number: string
  user_id: string | null
  status: string
  payment_status: string
  payment_method: string | null
  subtotal: string
  shipping_cost: string
  tax_amount: string
  discount_amount: string
  total: string
  currency: string
  shipping_name: string
  shipping_street: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  tracking_number: string | null
  estimated_delivery: string | null
  customer_email: string | null
  customer_phone: string | null
  created_at: string
  updated_at: string
}

interface OrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_sku: string
  product_image_url: string | null
  unit_price: string
  quantity: number
  discount_amount: string
  line_total: string
}

interface TimelineRow {
  id: string
  status: string
  description: string | null
  created_at: string
}

function toOrder(row: OrderRow, items: OrderLineItem[], timeline: OrderTimelineEntry[]): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    status: row.status as Order['status'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    paymentMethod: row.payment_method,
    subtotal: parseFloat(row.subtotal),
    shippingCost: parseFloat(row.shipping_cost),
    taxAmount: parseFloat(row.tax_amount),
    discountAmount: parseFloat(row.discount_amount),
    total: parseFloat(row.total),
    currency: row.currency,
    shippingName: row.shipping_name,
    shippingStreet: row.shipping_street,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    shippingZip: row.shipping_zip,
    shippingCountry: row.shipping_country,
    trackingNumber: row.tracking_number,
    estimatedDelivery: row.estimated_delivery,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    items,
    timeline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toLineItem(row: OrderItemRow): OrderLineItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    productImageUrl: row.product_image_url,
    unitPrice: parseFloat(row.unit_price),
    quantity: row.quantity,
    discountAmount: parseFloat(row.discount_amount),
    lineTotal: parseFloat(row.line_total),
  }
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ORD-${ts}-${rand}`
}

export const orderService = {
  async create(data: CreateOrderDTO, userId?: string): Promise<Order> {
    return withTransaction(async (client: PoolClient) => {
      const { business } = config
      const orderNumber = generateOrderNumber()

      // ── 1. Fetch current prices server-side (never trust client) ──────────
      interface PriceRow {
        id: string
        name: string
        sku: string
        price: string
        primary_image: string | null
        quantity_on_hand: number
        quantity_reserved: number
      }

      const productIds = data.items.map((i) => i.productId)
      const { rows: priceRows } = await client.query<PriceRow>(
        `SELECT p.id, p.name, p.sku, p.price,
                (SELECT url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image,
                COALESCE(i.quantity_on_hand, 0) AS quantity_on_hand,
                COALESCE(i.quantity_reserved, 0) AS quantity_reserved
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ANY($1) AND p.is_active = TRUE`,
        [productIds]
      )

      // ── 2. Validate all products found ────────────────────────────────────
      for (const item of data.items) {
        if (!priceRows.find((r) => r.id === item.productId)) {
          throw new NotFoundError(`Product ${item.productId} not found or inactive`)
        }
      }

      // ── 3. Validate inventory and reserve ─────────────────────────────────
      const lineItems: Array<{
        productId: string; name: string; sku: string; price: number
        imageUrl: string | null; quantity: number
      }> = []

      for (const item of data.items) {
        const product = priceRows.find((r) => r.id === item.productId)!
        const available = product.quantity_on_hand - product.quantity_reserved

        if (available < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${available}, Requested: ${item.quantity}`,
            422,
            'INSUFFICIENT_STOCK'
          )
        }

        // Atomic reservation
        const { rows: reserved } = await client.query(
          `UPDATE inventory
           SET quantity_reserved = quantity_reserved + $1
           WHERE product_id = $2 AND (quantity_on_hand - quantity_reserved) >= $1
           RETURNING product_id`,
          [item.quantity, item.productId]
        )
        if (reserved.length === 0) {
          throw new AppError(
            `Stock conflict for "${product.name}". Please try again.`,
            409,
            'STOCK_CONFLICT'
          )
        }

        lineItems.push({
          productId: item.productId,
          name: product.name,
          sku: product.sku,
          price: parseFloat(product.price),
          imageUrl: product.primary_image,
          quantity: item.quantity,
        })
      }

      // ── 4. Calculate totals server-side ───────────────────────────────────
      const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
      const shippingCost = data.shippingMethod === 'express'
        ? business.shippingExpress
        : subtotal >= business.freeShippingThreshold
          ? 0
          : business.shippingStandard
      const taxAmount = subtotal * business.taxRate
      const total = subtotal + shippingCost + taxAmount
      const estimatedDelivery = data.shippingMethod === 'express' ? 'Next business day' : '2–3 business days'

      // ── 5. Create order ───────────────────────────────────────────────────
      const { rows: [orderRow] } = await client.query<OrderRow>(
        `INSERT INTO orders
           (order_number, user_id, payment_method, subtotal, shipping_cost, tax_amount, total,
            shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
            estimated_delivery, customer_email, customer_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [orderNumber, userId ?? null, data.paymentMethod,
         subtotal.toFixed(2), shippingCost.toFixed(2), taxAmount.toFixed(2), total.toFixed(2),
         data.shippingName, data.shippingStreet, data.shippingCity,
         data.shippingState, data.shippingZip, data.shippingCountry,
         estimatedDelivery, data.customerEmail ?? null, data.customerPhone ?? null]
      )

      // ── 6. Create immutable order line items ──────────────────────────────
      const savedItems: OrderLineItem[] = []
      for (const li of lineItems) {
        const lineTotal = li.price * li.quantity
        const { rows: [itemRow] } = await client.query<OrderItemRow>(
          `INSERT INTO order_items
             (order_id, product_id, product_name, product_sku, product_image_url, unit_price, quantity, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING *`,
          [orderRow.id, li.productId, li.name, li.sku, li.imageUrl, li.price.toFixed(2), li.quantity, lineTotal.toFixed(2)]
        )
        savedItems.push(toLineItem(itemRow))
      }

      // ── 7. First timeline entry ───────────────────────────────────────────
      const { rows: [tl] } = await client.query<TimelineRow>(
        `INSERT INTO order_timeline (order_id, status, description)
         VALUES ($1, 'processing', 'Order received and payment pending')
         RETURNING *`,
        [orderRow.id]
      )

      return toOrder(orderRow, savedItems, [
        { id: tl.id, status: tl.status, description: tl.description, createdAt: tl.created_at }
      ])
    })
  },

  // Ownership rules: orders belonging to a user are only visible to that user
  // (or to internal/admin callers passing bypassOwnership). Guest orders
  // (user_id IS NULL) are retrievable by anyone holding the order UUID.
  async getById(id: string, access?: { userId?: string; bypassOwnership?: boolean }): Promise<Order> {
    const row = await queryOne<OrderRow>('SELECT * FROM orders o WHERE o.id = $1', [id])
    if (!row) throw new NotFoundError('Order')

    if (!access?.bypassOwnership && row.user_id !== null && row.user_id !== access?.userId) {
      throw new NotFoundError('Order')
    }

    const [items, timeline] = await Promise.all([
      query<OrderItemRow>('SELECT * FROM order_items WHERE order_id = $1', [id]),
      query<TimelineRow>('SELECT * FROM order_timeline WHERE order_id = $1 ORDER BY created_at', [id]),
    ])

    return toOrder(
      row,
      items.map(toLineItem),
      timeline.map((t) => ({ id: t.id, status: t.status, description: t.description, createdAt: t.created_at }))
    )
  },

  async getByOrderNumber(orderNumber: string): Promise<Order> {
    const row = await queryOne<OrderRow>('SELECT * FROM orders WHERE order_number = $1', [orderNumber])
    if (!row) throw new NotFoundError('Order')
    // Caller (public tracking route) exposes only non-PII fields.
    return this.getById(row.id, { bypassOwnership: true })
  },

  async listForUser(userId: string, params: { page: number; limit: number }): Promise<{ orders: Order[]; total: number }> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    const [rows, countRows] = await Promise.all([
      query<OrderRow>(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      ),
      query<{ count: string }>('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]),
    ])

    const orders = await Promise.all(rows.map((r) => this.getById(r.id, { bypassOwnership: true })))
    return { orders, total: parseInt(countRows[0]?.count ?? '0', 10) }
  },

  async listAll(params: { page: number; limit: number; status?: string }): Promise<{ orders: Order[]; total: number }> {
    const { page, limit, status } = params
    const offset = (page - 1) * limit
    const args: unknown[] = [limit, offset]
    if (status) args.push(status)

    const [rows, countRows] = await Promise.all([
      query<OrderRow>(
        `SELECT * FROM orders ${status ? 'WHERE status = $3' : ''} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        args
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) FROM orders ${status ? 'WHERE status = $1' : ''}`,
        status ? [status] : []
      ),
    ])

    const orders = await Promise.all(rows.map((r) => this.getById(r.id, { bypassOwnership: true })))
    return { orders, total: parseInt(countRows[0]?.count ?? '0', 10) }
  },

  async updateStatus(orderId: string, status: Order['status'], description?: string): Promise<Order> {
    await query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, orderId]
    )
    await query(
      'INSERT INTO order_timeline (order_id, status, description) VALUES ($1,$2,$3)',
      [orderId, status, description ?? `Status updated to ${status}`]
    )
    return this.getById(orderId, { bypassOwnership: true })
  },

  async updatePaymentStatus(orderId: string, paymentStatus: Order['paymentStatus']): Promise<Order> {
    await query('UPDATE orders SET payment_status = $1 WHERE id = $2', [paymentStatus, orderId])
    return this.getById(orderId, { bypassOwnership: true })
  },

  // ─── Payment lifecycle (idempotent by construction) ───────────────────────────

  // Marks a pending order paid, deducts confirmed inventory, and appends the
  // timeline entry — all in one transaction. Safe to call more than once: the
  // payment_status='pending' guard makes replays no-ops.
  async markPaid(orderId: string, description = 'Payment confirmed'): Promise<Order> {
    const settled = await withTransaction(async (client: PoolClient) => {
      const { rows: updated } = await client.query(
        `UPDATE orders SET payment_status = 'paid'
         WHERE id = $1 AND payment_status = 'pending'
         RETURNING id`,
        [orderId]
      )
      if (updated.length === 0) return false // already settled — idempotent no-op

      const { rows: items } = await client.query<{ product_id: string; quantity: number }>(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL',
        [orderId]
      )
      for (const item of items) {
        await client.query(
          `UPDATE inventory
           SET quantity_on_hand  = GREATEST(0, quantity_on_hand - $1),
               quantity_reserved = GREATEST(0, quantity_reserved - $1)
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        )
      }

      await client.query(
        `INSERT INTO order_timeline (order_id, status, description) VALUES ($1, 'processing', $2)`,
        [orderId, description]
      )
      return true
    })

    const result = await this.getById(orderId, { bypassOwnership: true })
    if (settled) {
      // Fire-and-forget — email failure must never block payment confirmation.
      emailService.sendOrderConfirmation(result).catch((err) =>
        console.error('[Order] Failed to send confirmation email:', err)
      )
    }
    return result
  },

  // Marks a pending order failed/cancelled and releases inventory reservations.
  // Guarded so a replayed webhook can never flip a paid order.
  async markFailed(orderId: string, reason: string): Promise<Order> {
    await withTransaction(async (client: PoolClient) => {
      const { rows: updated } = await client.query(
        `UPDATE orders SET payment_status = 'failed', status = 'cancelled'
         WHERE id = $1 AND payment_status = 'pending'
         RETURNING id`,
        [orderId]
      )
      if (updated.length === 0) return

      const { rows: items } = await client.query<{ product_id: string; quantity: number }>(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL',
        [orderId]
      )
      for (const item of items) {
        await client.query(
          `UPDATE inventory SET quantity_reserved = GREATEST(0, quantity_reserved - $1) WHERE product_id = $2`,
          [item.quantity, item.product_id]
        )
      }

      await client.query(
        `INSERT INTO order_timeline (order_id, status, description) VALUES ($1, 'cancelled', $2)`,
        [orderId, reason]
      )
    })
    return this.getById(orderId, { bypassOwnership: true })
  },

  // Transitions a paid order to refunded (money movement happens in Stripe;
  // this only syncs state on charge.refunded webhooks).
  async markRefunded(orderId: string, description: string): Promise<Order> {
    const updated = await query<{ id: string }>(
      `UPDATE orders SET payment_status = 'refunded', status = 'refunded'
       WHERE id = $1 AND payment_status = 'paid'
       RETURNING id`,
      [orderId]
    )
    if (updated.length > 0) {
      await query(
        `INSERT INTO order_timeline (order_id, status, description) VALUES ($1, 'refunded', $2)`,
        [orderId, description]
      )
    }
    return this.getById(orderId, { bypassOwnership: true })
  },
}
