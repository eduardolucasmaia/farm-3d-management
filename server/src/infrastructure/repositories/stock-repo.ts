import type { Db } from '../db/database.ts'
import type { StockMovementKind } from '../../domain/enums.ts'
import type { FreeLot } from '../../domain/rules/fifo-reservation.ts'

export interface FreeLotRow extends FreeLot {
  costCentsPerKg: number
  lotCode: string
}

/** Saldos por lote de material com livre > 0. Saldo agregado (sem lote) não entra na reserva. */
export function listFreeLots(db: Db, materialId: number): FreeLotRow[] {
  return db
    .prepare(
      `SELECT s.id AS stockItemId, ml.id AS materialLotId, ml.received_at AS receivedAt,
              s.quantity_mg - s.reserved_mg AS freeMg, ml.cost_cents_per_kg AS costCentsPerKg, ml.lot_code AS lotCode
         FROM stock_items s JOIN material_lots ml ON ml.id = s.material_lot_id
        WHERE s.material_id = ? AND s.quantity_mg - s.reserved_mg > 0
        ORDER BY ml.received_at, ml.id`,
    )
    .all(materialId) as unknown as FreeLotRow[]
}

export function addReservedMg(db: Db, stockItemId: number, mg: number): void {
  db.prepare('UPDATE stock_items SET reserved_mg = reserved_mg + ? WHERE id = ?').run(mg, stockItemId)
}

export function insertMovement(
  db: Db,
  movement: {
    kind: StockMovementKind
    materialId: number
    stockItemId: number | null
    quantityMg: number
    unitCostCentsPerKg: number
    createdAt: string
    userId: string
    productionLotId?: number | null
    printRunId?: number | null
    purchaseReceiptId?: number | null
  },
): number {
  return Number(
    db
      .prepare(
        `INSERT INTO stock_movements (kind, material_id, stock_item_id, quantity_mg, unit_cost_cents_per_kg, created_at,
           user_id, production_lot_id, print_run_id, purchase_receipt_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        movement.kind,
        movement.materialId,
        movement.stockItemId,
        movement.quantityMg,
        movement.unitCostCentsPerKg,
        movement.createdAt,
        movement.userId,
        movement.productionLotId ?? null,
        movement.printRunId ?? null,
        movement.purchaseReceiptId ?? null,
      ).lastInsertRowid,
  )
}
