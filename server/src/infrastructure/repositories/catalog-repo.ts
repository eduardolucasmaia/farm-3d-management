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

// ── Printers (CRUD completo, T035) ──

export function createPrinter(
  db: Db,
  name: string,
  model: string | null,
  costCentsPerHour: number,
  energyWhPerHour: number | null,
  maintenanceLimitHours: number,
  preparationSeconds: number,
  compatibleMaterialIds: readonly number[],
): number {
  const result = db
    .prepare(
      'INSERT INTO printers (name, model, cost_cents_per_hour, energy_wh_per_hour, maintenance_limit_hours, preparation_seconds, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    )
    .run(name, model, costCentsPerHour, energyWhPerHour, maintenanceLimitHours, preparationSeconds)
  const printerId = result.lastInsertRowid as number
  if (compatibleMaterialIds.length > 0) {
    for (const matId of compatibleMaterialIds) {
      db.prepare('INSERT OR IGNORE INTO printer_materials (printer_id, material_id) VALUES (?, ?)').run(printerId, matId)
    }
  }
  return printerId
}

export function getPrinter(db: Db, id: number): PrinterWithMaterials | undefined {
  const row = db.prepare('SELECT * FROM printers WHERE id = ?').get(id) as PrinterRow | undefined
  return row ? { ...row, compatibleMaterials: materialsOf(db, row.id) } : undefined
}

export function listPrinters(db: Db): PrinterWithMaterials[] {
  const rows = db.prepare('SELECT * FROM printers ORDER BY name').all() as unknown as PrinterRow[]
  return rows.map((row) => ({ ...row, compatibleMaterials: materialsOf(db, row.id) }))
}

export function updatePrinter(
  db: Db,
  id: number,
  name: string,
  model: string | null,
  costCentsPerHour: number,
  energyWhPerHour: number | null,
  accumulatedSeconds: number,
  preparationSeconds: number,
  isActive: boolean,
  operationalStatus: PrinterOperationalStatus,
  compatibleMaterialIds: readonly number[],
): void {
  db
    .prepare(
      'UPDATE printers SET name = ?, model = ?, cost_cents_per_hour = ?, energy_wh_per_hour = ?, accumulated_seconds = ?, preparation_seconds = ?, is_active = ?, operational_status = ? WHERE id = ?',
    )
    .run(name, model, costCentsPerHour, energyWhPerHour, accumulatedSeconds, preparationSeconds, isActive ? 1 : 0, operationalStatus, id)
  // Replace compatible materials
  db.prepare('DELETE FROM printer_materials WHERE printer_id = ?').run(id)
  if (compatibleMaterialIds.length > 0) {
    for (const matId of compatibleMaterialIds) {
      db.prepare('INSERT INTO printer_materials (printer_id, material_id) VALUES (?, ?)').run(id, matId)
    }
  }
}

export function deletePrinter(db: Db, id: number): void {
  db.prepare('DELETE FROM printer_materials WHERE printer_id = ?').run(id)
  db.prepare('DELETE FROM printers WHERE id = ?').run(id)
}

export function addPrinterMaterial(db: Db, printerId: number, materialId: number): void {
  db.prepare('INSERT OR IGNORE INTO printer_materials (printer_id, material_id) VALUES (?, ?)').run(printerId, materialId)
}

// ── Print Profiles (CRUD completo, T035) ──

export interface PrintProfileRow {
  id: number
  name: string
  material_id: number | null
  pieces_per_plate: number
  seconds_per_plate: number
  mg_per_plate: number
}

export function createPrintProfile(
  db: Db,
  name: string,
  materialId: number | null,
  piecesPerPlate: number,
  secondsPerPlate: number,
  mgPerPlate: number,
): number {
  const result = db
    .prepare(
      'INSERT INTO print_profiles (name, material_id, pieces_per_plate, seconds_per_plate, mg_per_plate) VALUES (?, ?, ?, ?, ?)',
    )
    .run(name, materialId, piecesPerPlate, secondsPerPlate, mgPerPlate)
  return result.lastInsertRowid as number
}

export function getPrintProfile(db: Db, id: number): PrintProfileRow | undefined {
  const row = db.prepare('SELECT * FROM print_profiles WHERE id = ?').get(id) as PrintProfileRow | undefined
  return row ?? undefined
}

export function listPrintProfiles(db: Db): PrintProfileRow[] {
  return db.prepare('SELECT * FROM print_profiles ORDER BY name').all() as unknown as PrintProfileRow[]
}

export function updatePrintProfile(
  db: Db,
  id: number,
  name: string,
  materialId: number | null,
  piecesPerPlate: number,
  secondsPerPlate: number,
  mgPerPlate: number,
): void {
  db
    .prepare(
      'UPDATE print_profiles SET name = ?, material_id = ?, pieces_per_plate = ?, seconds_per_plate = ?, mg_per_plate = ? WHERE id = ?',
    )
    .run(name, materialId, piecesPerPlate, secondsPerPlate, mgPerPlate, id)
}

export function deletePrintProfile(db: Db, id: number): void {
  db.prepare('DELETE FROM print_profiles WHERE id = ?').run(id)
}

// ── Products (CRUD completo + cores/tamanhos, T035) ──

export interface ProductRow {
  id: number
  name: string
  sku: string
  default_sell_price_cents: number
  default_print_profile_id: number | null
  default_material_id: number | null
  is_for_sale: number
}

export interface ProductExtended extends ProductRow {
  offered_colors: number[]
  offered_sizes: string[]
}

function colorsOf(db: Db, productId: number): number[] {
  const rows = db
    .prepare(
      'SELECT color_id FROM product_colors WHERE product_id = ? ORDER BY color_id',
    )
    .all(productId) as { color_id: number }[]
  return rows.map((r) => r.color_id)
}

function sizesOf(db: Db, productId: number): string[] {
  const rows = db
    .prepare(
      'SELECT size FROM product_sizes WHERE product_id = ? ORDER BY size',
    )
    .all(productId) as { size: string }[]
  return rows.map((r) => r.size)
}

export function createProduct(
  db: Db,
  name: string,
  sku: string,
  defaultSellPriceCents: number,
  defaultPrintProfileId: number,
  defaultMaterialId: number | null,
  isForSale: boolean,
): number {
  const result = db
    .prepare(
      'INSERT INTO products (name, sku, default_sell_price_cents, default_print_profile_id, default_material_id, is_for_sale) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(name, sku, defaultSellPriceCents, defaultPrintProfileId, defaultMaterialId, isForSale ? 1 : 0)
  return result.lastInsertRowid as number
}

export function getProduct(db: Db, id: number): ProductExtended | undefined {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined
  if (!row) return undefined
  return { ...row, offered_colors: colorsOf(db, row.id), offered_sizes: sizesOf(db, row.id) }
}

export function listProducts(db: Db): ProductExtended[] {
  const rows = db.prepare('SELECT * FROM products ORDER BY name').all() as unknown as ProductRow[]
  return rows.map((row) => ({ ...row, offered_colors: colorsOf(db, row.id), offered_sizes: sizesOf(db, row.id) }))
}

export function updateProduct(
  db: Db,
  id: number,
  name: string,
  sku: string,
  defaultSellPriceCents: number,
  defaultPrintProfileId: number,
  defaultMaterialId: number | null,
  isForSale: boolean,
): void {
  db
    .prepare(
      'UPDATE products SET name = ?, sku = ?, default_sell_price_cents = ?, default_print_profile_id = ?, default_material_id = ?, is_for_sale = ? WHERE id = ?',
    )
    .run(name, sku, defaultSellPriceCents, defaultPrintProfileId, defaultMaterialId, isForSale ? 1 : 0, id)
}

export function deleteProduct(db: Db, id: number): void {
  db.prepare('DELETE FROM product_colors WHERE product_id = ?').run(id)
  db.prepare('DELETE FROM product_sizes WHERE product_id = ?').run(id)
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
}

export function addProductColor(db: Db, productId: number, colorId: number): void {
  db.prepare('INSERT OR IGNORE INTO product_colors (product_id, color_id) VALUES (?, ?)').run(productId, colorId)
}

export function removeProductColor(db: Db, productId: number, colorId: number): void {
  db.prepare('DELETE FROM product_colors WHERE product_id = ? AND color_id = ?').run(productId, colorId)
}

export function listProductColors(db: Db, productId: number): number[] {
  const rows = db.prepare('SELECT color_id FROM product_colors WHERE product_id = ? ORDER BY color_id').all(productId) as { color_id: number }[]
  return rows.map((r) => r.color_id)
}

export function addProductSize(db: Db, productId: number, size: string): void {
  db.prepare('INSERT OR IGNORE INTO product_sizes (product_id, size) VALUES (?, ?)').run(productId, size)
}

export function removeProductSize(db: Db, productId: number, size: string): void {
  db.prepare('DELETE FROM product_sizes WHERE product_id = ? AND size = ?').run(productId, size)
}

export function listProductSizes(db: Db, productId: number): string[] {
  const rows = db.prepare('SELECT size FROM product_sizes WHERE product_id = ? ORDER BY size').all(productId) as { size: string }[]
  return rows.map((r) => r.size)
}
