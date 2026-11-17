import type { Db } from '../db/database.ts'
import type { ProductionLotStatus } from '../../domain/enums.ts'

export interface LotRow {
  id: number
  sales_order_id: number
  order_line_id: number
  product_id: number
  material_id: number
  lot_index: number
  qty_planned: number
  qty_completed: number
  status: ProductionLotStatus
  planned_mg: number
  planned_seconds: number
  released_pieces_per_plate: number
  released_seconds_per_plate: number
  released_mg_per_plate: number
}

export interface LotListRow extends LotRow {
  order_number: string
  product_name: string
  material_name: string
  printer_id: number | null
  printer_name: string | null
  priority: number | null
  position: number | null
  reserved_mg: number
}

export interface QueueItemRow {
  id: number
  production_lot_id: number
  printer_id: number | null
  priority: number
  position: number
}

export function releasedLineIds(db: Db, orderId: number): Set<number> {
  const rows = db
    .prepare('SELECT DISTINCT order_line_id AS id FROM production_lots WHERE sales_order_id = ?')
    .all(orderId) as { id: number }[]
  return new Set(rows.map((row) => row.id))
}

export function countLots(db: Db, orderId: number): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM production_lots WHERE sales_order_id = ?').get(orderId) as { c: number }).c
}

export function insertLot(
  db: Db,
  lot: {
    salesOrderId: number
    orderLineId: number
    productId: number
    materialId: number
    lotIndex: number
    qtyPlanned: number
    status: ProductionLotStatus
    plannedMg: number
    plannedSeconds: number
    releasedPiecesPerPlate: number
    releasedSecondsPerPlate: number
    releasedMgPerPlate: number
    createdAt: string
    releasedAt: string | null
  },
): number {
  return Number(
    db
      .prepare(
        `INSERT INTO production_lots (sales_order_id, order_line_id, product_id, material_id, lot_index, qty_planned,
           qty_completed, status, planned_mg, planned_seconds, released_pieces_per_plate, released_seconds_per_plate,
           released_mg_per_plate, created_at, released_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        lot.salesOrderId,
        lot.orderLineId,
        lot.productId,
        lot.materialId,
        lot.lotIndex,
        lot.qtyPlanned,
        lot.status,
        lot.plannedMg,
        lot.plannedSeconds,
        lot.releasedPiecesPerPlate,
        lot.releasedSecondsPerPlate,
        lot.releasedMgPerPlate,
        lot.createdAt,
        lot.releasedAt,
      ).lastInsertRowid,
  )
}

export function insertReservation(db: Db, lotId: number, stockItemId: number, mg: number): void {
  db.prepare(
    'INSERT INTO production_material_reservations (production_lot_id, stock_item_id, reserved_mg) VALUES (?, ?, ?)',
  ).run(lotId, stockItemId, mg)
}

export function getLot(db: Db, id: number): LotRow | undefined {
  return db.prepare('SELECT * FROM production_lots WHERE id = ?').get(id) as LotRow | undefined
}

export function updateLotStatus(db: Db, id: number, status: ProductionLotStatus): void {
  db.prepare('UPDATE production_lots SET status = ? WHERE id = ?').run(status, id)
}

export function getQueueItem(db: Db, lotId: number): QueueItemRow | undefined {
  return db.prepare('SELECT * FROM print_queue_items WHERE production_lot_id = ?').get(lotId) as QueueItemRow | undefined
}

/** Acrescenta o lote ao fim da fila. Devolve a posição. */
export function insertQueueItem(db: Db, lotId: number, printerId: number | null, priority: number, now: string): number {
  const position =
    ((db.prepare('SELECT MAX(position) AS p FROM print_queue_items').get() as { p: number | null }).p ?? 0) + 1
  db.prepare(
    'INSERT INTO print_queue_items (production_lot_id, printer_id, priority, position, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(lotId, printerId, priority, position, now)
  return position
}

/** Atualiza impressora e prioridade do item existente, sem mudar a posição. */
export function updateQueueItem(db: Db, lotId: number, printerId: number | null, priority: number): void {
  db.prepare('UPDATE print_queue_items SET printer_id = ?, priority = ? WHERE production_lot_id = ?').run(
    printerId,
    priority,
    lotId,
  )
}

const LOT_LIST_SELECT = `SELECT l.*, o.number AS order_number, p.name AS product_name, m.name AS material_name,
       q.printer_id, pr.name AS printer_name, q.priority, q.position,
       COALESCE((SELECT SUM(r.reserved_mg) FROM production_material_reservations r WHERE r.production_lot_id = l.id), 0)
         AS reserved_mg
  FROM production_lots l
  JOIN sales_orders o ON o.id = l.sales_order_id
  JOIN products p ON p.id = l.product_id
  JOIN materials m ON m.id = l.material_id
  LEFT JOIN print_queue_items q ON q.production_lot_id = l.id
  LEFT JOIN printers pr ON pr.id = q.printer_id`

export function listLotsByStatus(db: Db, statuses: readonly ProductionLotStatus[]): LotListRow[] {
  const placeholders = statuses.map(() => '?').join(', ')
  return db
    .prepare(
      `${LOT_LIST_SELECT} WHERE l.status IN (${placeholders})
       ORDER BY q.position IS NULL, q.position, l.sales_order_id, l.lot_index`,
    )
    .all(...statuses) as unknown as LotListRow[]
}

export function listOrderLots(db: Db, orderId: number): LotListRow[] {
  return db
    .prepare(`${LOT_LIST_SELECT} WHERE l.sales_order_id = ? ORDER BY l.lot_index`)
    .all(orderId) as unknown as LotListRow[]
}

export function lotReservations(db: Db, lotId: number): { material_lot_code: string | null; reserved_mg: number }[] {
  return db
    .prepare(
      `SELECT ml.lot_code AS material_lot_code, r.reserved_mg
         FROM production_material_reservations r
         JOIN stock_items s ON s.id = r.stock_item_id
         LEFT JOIN material_lots ml ON ml.id = s.material_lot_id
        WHERE r.production_lot_id = ?
        ORDER BY r.id`,
    )
    .all(lotId) as { material_lot_code: string | null; reserved_mg: number }[]
}
