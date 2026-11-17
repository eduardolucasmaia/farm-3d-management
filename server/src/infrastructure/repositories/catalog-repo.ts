import type { Db } from '../db/database.ts'
import type { PrinterOperationalStatus } from '../../domain/enums.ts'

export interface PrinterRow {
  id: number
  name: string
  model: string | null
  cost_cents_per_hour: number
  energy_wh_per_hour: number | null
  maintenance_limit_hours: number
  accumulated_seconds: number
  preparation_seconds: number
  is_active: number
  operational_status: PrinterOperationalStatus
}

export interface PrinterWithMaterials extends PrinterRow {
  compatibleMaterials: { id: number; name: string }[]
}

function materialsOf(db: Db, printerId: number): { id: number; name: string }[] {
  return db
    .prepare(
      `SELECT m.id, m.name FROM printer_materials pm JOIN materials m ON m.id = pm.material_id
        WHERE pm.printer_id = ? ORDER BY m.name`,
    )
    .all(printerId) as { id: number; name: string }[]
}

export function getPrinter(db: Db, id: number): PrinterWithMaterials | undefined {
  const row = db.prepare('SELECT * FROM printers WHERE id = ?').get(id) as PrinterRow | undefined
  return row ? { ...row, compatibleMaterials: materialsOf(db, row.id) } : undefined
}

export function listPrinters(db: Db): PrinterWithMaterials[] {
  const rows = db.prepare('SELECT * FROM printers ORDER BY name').all() as unknown as PrinterRow[]
  return rows.map((row) => ({ ...row, compatibleMaterials: materialsOf(db, row.id) }))
}
