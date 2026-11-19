// Repositório para clientes, fornecedores, cores e materiais (US2, T035).
// Tabelas criadas em 0002-production-lots.sql.

import type { Db } from '../db/database.ts'

// ── Customers ──

export interface CustomerRow {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export function createCustomer(
  db: Db,
  name: string,
  email: string | null,
  phone: string | null,
  address: string | null,
): number {
  const result = db
    .prepare('INSERT INTO customers (name, email, phone, address, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, phone, address, new Date().toISOString())
  return result.lastInsertRowid as number
}

export function getCustomer(db: Db, id: number): CustomerRow | undefined {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined
  return row ?? undefined
}

export function listCustomers(db: Db): CustomerRow[] {
  return db.prepare('SELECT * FROM customers ORDER BY name').all() as unknown as CustomerRow[]
}

export function updateCustomer(db: Db, id: number, name: string, email: string | null, phone: string | null, address: string | null): void {
  db.prepare('UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?').run(name, email, phone, address, id)
}

export function deleteCustomer(db: Db, id: number): void {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id)
}

// ── Suppliers ──

export interface SupplierRow {
  id: number
  name: string
  payment_terms: string | null
  average_lead_time_days: number | null
  contact: string | null
  created_at: string
}

export function createSupplier(
  db: Db,
  name: string,
  paymentTerms: string | null,
  averageLeadTimeDays: number | null,
  contact: string | null,
): number {
  const result = db
    .prepare(
      'INSERT INTO suppliers (name, payment_terms, average_lead_time_days, contact, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(name, paymentTerms, averageLeadTimeDays, contact, new Date().toISOString())
  return result.lastInsertRowid as number
}

export function getSupplier(db: Db, id: number): SupplierRow | undefined {
  const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as SupplierRow | undefined
  return row ?? undefined
}

export function listSuppliers(db: Db): SupplierRow[] {
  return db.prepare('SELECT * FROM suppliers ORDER BY name').all() as unknown as SupplierRow[]
}

export function updateSupplier(
  db: Db,
  id: number,
  name: string,
  paymentTerms: string | null,
  averageLeadTimeDays: number | null,
  contact: string | null,
): void {
  db.prepare('UPDATE suppliers SET name = ?, payment_terms = ?, average_lead_time_days = ?, contact = ? WHERE id = ?').run(name, paymentTerms, averageLeadTimeDays, contact, id)
}

export function deleteSupplier(db: Db, id: number): void {
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(id)
}

// ── Colors ──

export interface ColorRow {
  id: number
  name: string
  hex: string | null
}

export function createColor(db: Db, name: string, hex: string | null): number {
  const result = db.prepare('INSERT INTO colors (name, hex) VALUES (?, ?)').run(name, hex)
  return result.lastInsertRowid as number
}

export function getColor(db: Db, id: number): ColorRow | undefined {
  const row = db.prepare('SELECT * FROM colors WHERE id = ?').get(id) as ColorRow | undefined
  return row ?? undefined
}

export function listColors(db: Db): ColorRow[] {
  return db.prepare('SELECT * FROM colors ORDER BY name').all() as unknown as ColorRow[]
}

export function updateColor(db: Db, id: number, name: string, hex: string | null): void {
  db.prepare('UPDATE colors SET name = ?, hex = ? WHERE id = ?').run(name, hex, id)
}

export function deleteColor(db: Db, id: number): void {
  db.prepare('DELETE FROM colors WHERE id = ?').run(id)
}

// ── Materials ──

export interface MaterialRow {
  id: number
  name: string
  kind: string
  brand: string | null
  diameter_um: number | null
  color_id: number | null
  reference_cost_cents_per_kg: number
  reorder_point_mg: number | null
}

export function createMaterial(
  db: Db,
  name: string,
  kind: string,
  brand: string | null,
  diameterUm: number | null,
  colorId: number | null,
  referenceCostCentsPerKg: number,
  reorderPointMg: number | null,
): number {
  const result = db
    .prepare(
      'INSERT INTO materials (name, kind, brand, diameter_um, color_id, reference_cost_cents_per_kg, reorder_point_mg) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(name, kind, brand, diameterUm, colorId, referenceCostCentsPerKg, reorderPointMg)
  return result.lastInsertRowid as number
}

export function getMaterial(db: Db, id: number): MaterialRow | undefined {
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as MaterialRow | undefined
  return row ?? undefined
}

export function listMaterials(db: Db): MaterialRow[] {
  return db.prepare('SELECT * FROM materials ORDER BY name').all() as unknown as MaterialRow[]
}

export function updateMaterial(
  db: Db,
  id: number,
  name: string,
  kind: string,
  brand: string | null,
  diameterUm: number | null,
  colorId: number | null,
  referenceCostCentsPerKg: number,
  reorderPointMg: number | null,
): void {
  db.prepare(
    'UPDATE materials SET name = ?, kind = ?, brand = ?, diameter_um = ?, color_id = ?, reference_cost_cents_per_kg = ?, reorder_point_mg = ? WHERE id = ?',
  ).run(name, kind, brand, diameterUm, colorId, referenceCostCentsPerKg, reorderPointMg, id)
}

export function deleteMaterial(db: Db, id: number): void {
  db.prepare('DELETE FROM materials WHERE id = ?').run(id)
}
