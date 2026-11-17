import type { Db } from '../db/database.ts'
import type { CommercialOrderStatus } from '../../domain/enums.ts'

export interface OrderRow {
  id: number
  number: string
  customer_id: number
  customer_name: string
  commercial_status: CommercialOrderStatus
  promised_date: string | null
}

export interface OrderLineRow {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price_cents: number
  material_id: number | null
  material_name: string | null
  color_name: string | null
  size: string | null
  pieces_per_plate: number | null
  seconds_per_plate: number | null
  mg_per_plate: number | null
}

const ORDER_SELECT = `SELECT o.id, o.number, o.customer_id, c.name AS customer_name, o.commercial_status, o.promised_date
  FROM sales_orders o JOIN customers c ON c.id = o.customer_id`

export function getOrder(db: Db, id: number): OrderRow | undefined {
  return db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(id) as OrderRow | undefined
}

export function listOrders(db: Db): OrderRow[] {
  return db.prepare(`${ORDER_SELECT} ORDER BY o.id DESC`).all() as unknown as OrderRow[]
}

export function getOrderLines(db: Db, orderId: number): OrderLineRow[] {
  return db
    .prepare(
      `SELECT l.id, l.product_id, p.name AS product_name, l.quantity, l.unit_price_cents, l.material_id,
              m.name AS material_name, col.name AS color_name, l.size,
              pp.pieces_per_plate, pp.seconds_per_plate, pp.mg_per_plate
         FROM order_lines l
         JOIN products p ON p.id = l.product_id
         LEFT JOIN materials m ON m.id = l.material_id
         LEFT JOIN colors col ON col.id = l.color_id
         LEFT JOIN print_profiles pp ON pp.id = p.default_print_profile_id
        WHERE l.sales_order_id = ?
        ORDER BY l.id`,
    )
    .all(orderId) as unknown as OrderLineRow[]
}

export function updateOrderStatus(db: Db, id: number, status: CommercialOrderStatus): void {
  db.prepare('UPDATE sales_orders SET commercial_status = ? WHERE id = ?').run(status, id)
}
