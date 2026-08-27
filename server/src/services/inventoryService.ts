import { query, queryOne } from '../db/client'
import { NotFoundError } from '../middleware/errorHandler'
import type { InventoryRecord, StockStatus } from '../types'

interface InventoryStatusRow {
  product_id: string
  quantity_on_hand: string
  quantity_reserved: string
  quantity_available: string
  low_stock_threshold: string
  stock_status: StockStatus
  supplier: string | null
  restock_eta: string | null
}

function toInventory(row: InventoryStatusRow): InventoryRecord {
  return {
    productId: row.product_id,
    quantityOnHand: parseInt(row.quantity_on_hand, 10),
    quantityReserved: parseInt(row.quantity_reserved, 10),
    quantityAvailable: parseInt(row.quantity_available, 10),
    lowStockThreshold: parseInt(row.low_stock_threshold, 10),
    stockStatus: row.stock_status,
    supplier: row.supplier,
    restockEta: row.restock_eta,
  }
}

export const inventoryService = {
  async getByProductId(productId: string): Promise<InventoryRecord> {
    const row = await queryOne<InventoryStatusRow>(
      `SELECT i.*, ivs.stock_status, ivs.quantity_available
       FROM inventory i
       JOIN inventory_status ivs ON ivs.product_id = i.product_id
       WHERE i.product_id = $1`,
      [productId]
    )
    if (!row) throw new NotFoundError('Inventory record')
    return toInventory(row)
  },

  async listLowStock(threshold?: number): Promise<InventoryRecord[]> {
    const rows = await query<InventoryStatusRow>(
      `SELECT i.*, ivs.stock_status, ivs.quantity_available
       FROM inventory i
       JOIN inventory_status ivs ON ivs.product_id = i.product_id
       WHERE ivs.quantity_available <= COALESCE($1, i.low_stock_threshold)
       ORDER BY ivs.quantity_available ASC`,
      [threshold ?? null]
    )
    return rows.map(toInventory)
  },

  async adjust(productId: string, data: {
    quantityOnHand?: number
    lowStockThreshold?: number
    supplier?: string
    restockEta?: string
  }): Promise<InventoryRecord> {
    const row = await queryOne<InventoryStatusRow>(
      `UPDATE inventory
       SET quantity_on_hand    = COALESCE($1, quantity_on_hand),
           low_stock_threshold = COALESCE($2, low_stock_threshold),
           supplier            = COALESCE($3, supplier),
           restock_eta         = COALESCE($4, restock_eta),
           updated_at          = NOW()
       WHERE product_id = $5
       RETURNING *,
         (quantity_on_hand - quantity_reserved) AS quantity_available,
         CASE
           WHEN (quantity_on_hand - quantity_reserved) <= 0 THEN 'out-of-stock'
           WHEN (quantity_on_hand - quantity_reserved) <= low_stock_threshold THEN 'low-stock'
           ELSE 'in-stock'
         END AS stock_status`,
      [data.quantityOnHand ?? null, data.lowStockThreshold ?? null,
       data.supplier ?? null, data.restockEta ?? null, productId]
    )
    if (!row) throw new NotFoundError('Inventory record')
    return toInventory(row)
  },

  /**
   * Reserve inventory for checkout. Uses UPDATE ... WHERE to prevent overselling.
   * Returns false if insufficient stock.
   */
  async reserve(productId: string, quantity: number): Promise<boolean> {
    const result = await query(
      `UPDATE inventory
       SET quantity_reserved = quantity_reserved + $1
       WHERE product_id = $2
         AND (quantity_on_hand - quantity_reserved) >= $1
       RETURNING product_id`,
      [quantity, productId]
    )
    return result.length > 0
  },

  /**
   * Deduct reserved quantity after order is confirmed.
   */
  async deductConfirmed(productId: string, quantity: number): Promise<void> {
    await query(
      `UPDATE inventory
       SET quantity_on_hand  = quantity_on_hand - $1,
           quantity_reserved = quantity_reserved - $1
       WHERE product_id = $2`,
      [quantity, productId]
    )
  },

  /**
   * Release reservation (e.g., cart abandonment or order cancellation).
   */
  async releaseReservation(productId: string, quantity: number): Promise<void> {
    await query(
      `UPDATE inventory
       SET quantity_reserved = GREATEST(0, quantity_reserved - $1)
       WHERE product_id = $2`,
      [quantity, productId]
    )
  },
}
