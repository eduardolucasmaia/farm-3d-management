import type { Db } from '../../src/infrastructure/db/database.ts'
import type { CommercialOrderStatus } from '../../src/domain/enums.ts'

// Monta cenários direto em SQL para os testes de orquestração.

function insert(db: Db, sql: string, ...params: (string | number | null)[]): number {
  return Number(db.prepare(sql).run(...params).lastInsertRowid)
}

export interface ScenarioOptions {
  quantity?: number
  orderStatus?: CommercialOrderStatus
  /** Saldo livre de cada lote de material, do mais antigo ao mais novo, em mg. */
  materialLotsMg?: number[]
  withProfile?: boolean
}

export interface Scenario {
  supplierId: number
  materialId: number
  otherMaterialId: number
  stockItemIds: number[]
  productId: number
  orderId: number
  orderLineId: number
  printerAId: number
  printerBId: number
}

export function buildScenario(db: Db, options: ScenarioOptions = {}): Scenario {
  const { quantity = 10, orderStatus = 'Approved', materialLotsMg = [60000, 1000000], withProfile = true } = options
  const supplierId = insert(db, "INSERT INTO suppliers (name, created_at) VALUES ('Fornecedor teste', '2026-01-01T00:00:00.000Z')")
  const materialId = insert(
    db,
    "INSERT INTO materials (name, kind, reference_cost_cents_per_kg) VALUES ('PLA teste', 'Filament', 8990)",
  )
  const otherMaterialId = insert(
    db,
    "INSERT INTO materials (name, kind, reference_cost_cents_per_kg) VALUES ('PETG teste', 'Filament', 9990)",
  )
  const stockItemIds = materialLotsMg.map((mg, i) => {
    const lotId = insert(
      db,
      `INSERT INTO material_lots (material_id, supplier_id, lot_code, received_at, initial_weight_mg, current_weight_mg, cost_cents_per_kg)
       VALUES (?, ?, ?, ?, ?, ?, 8990)`,
      materialId,
      supplierId,
      `L${i + 1}`,
      `2026-10-0${i + 1}T10:00:00.000Z`,
      Math.max(mg, 1),
      mg,
    )
    return insert(
      db,
      'INSERT INTO stock_items (material_id, material_lot_id, quantity_mg, reserved_mg) VALUES (?, ?, ?, 0)',
      materialId,
      lotId,
      mg,
    )
  })
  const profileId = withProfile
    ? insert(
        db,
        "INSERT INTO print_profiles (name, material_id, pieces_per_plate, seconds_per_plate, mg_per_plate) VALUES ('Perfil teste', ?, 4, 3600, 40000)",
        materialId,
      )
    : null
  const productId = insert(
    db,
    `INSERT INTO products (name, sku, default_sell_price_cents, default_print_profile_id, default_material_id, is_for_sale)
     VALUES ('Suporte teste', 'SUP-T', 2500, ?, ?, 1)`,
    profileId,
    materialId,
  )
  const customerId = insert(db, "INSERT INTO customers (name, created_at) VALUES ('Cliente teste', '2026-01-01T00:00:00.000Z')")
  const orderId = insert(
    db,
    `INSERT INTO sales_orders (number, customer_id, commercial_status, promised_date, freight_cents, packaging_cents, created_at)
     VALUES ('PED-T-1', ?, ?, '2026-11-24', 0, 0, '2026-11-17T00:00:00.000Z')`,
    customerId,
    orderStatus,
  )
  const orderLineId = insert(
    db,
    'INSERT INTO order_lines (sales_order_id, product_id, quantity, unit_price_cents, material_id) VALUES (?, ?, ?, 2500, ?)',
    orderId,
    productId,
    quantity,
    materialId,
  )
  const printerSql = `INSERT INTO printers (name, cost_cents_per_hour, energy_wh_per_hour, maintenance_limit_hours, accumulated_seconds,
    preparation_seconds, is_active, operational_status) VALUES (?, 400, 120, 200, 0, 600, 1, 'Available')`
  const printerAId = insert(db, printerSql, 'Mesa A')
  const printerBId = insert(db, printerSql, 'Mesa B')
  insert(db, 'INSERT INTO printer_materials (printer_id, material_id) VALUES (?, ?)', printerAId, materialId)
  insert(db, 'INSERT INTO printer_materials (printer_id, material_id) VALUES (?, ?)', printerBId, otherMaterialId)
  return { supplierId, materialId, otherMaterialId, stockItemIds, productId, orderId, orderLineId, printerAId, printerBId }
}

export function count(db: Db, table: string, where = '1 = 1', ...params: (string | number)[]): number {
  return (db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`).get(...params) as { c: number }).c
}

export function reservedMg(db: Db, stockItemId: number): number {
  return (db.prepare('SELECT reserved_mg AS r FROM stock_items WHERE id = ?').get(stockItemId) as { r: number }).r
}
