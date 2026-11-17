import type { Db } from '../db/database.ts'
import { withTransaction } from '../db/database.ts'

// T030: dados fictícios da seção 1 do quickstart. Só em development.
// Todo nome carrega "(fictício)" (princípio V; FR-025).

export const DEMO_SKU = 'DEMO-SUPORTE'

function insert(db: Db, sql: string, ...params: (string | number | null)[]): number {
  return Number(db.prepare(sql).run(...params).lastInsertRowid)
}

function addDays(instant: string, days: number): string {
  return new Date(Date.parse(instant) + days * 86_400_000).toISOString().slice(0, 10)
}

/** Cria a semente se ainda não existe. Devolve true quando criou. */
export function seedDemo(db: Db, now: string): boolean {
  if (db.prepare('SELECT 1 FROM products WHERE sku = ?').get(DEMO_SKU)) return false

  withTransaction(db, () => {
    const supplierId = insert(
      db,
      'INSERT INTO suppliers (name, payment_terms, average_lead_time_days, created_at) VALUES (?, ?, ?, ?)',
      'Fornecedor demo (fictício)',
      '30 dias (fictício)',
      7,
      now,
    )
    const blackId = insert(db, 'INSERT INTO colors (name, hex) VALUES (?, ?)', 'Preto', '#000000')
    const plaId = insert(
      db,
      'INSERT INTO materials (name, kind, brand, diameter_um, color_id, reference_cost_cents_per_kg, reorder_point_mg) VALUES (?, ?, ?, ?, ?, ?, ?)',
      'PLA preto (fictício)',
      'Filament',
      'Marca demo',
      1750,
      blackId,
      8990,
      200_000,
    )
    const petgId = insert(
      db,
      'INSERT INTO materials (name, kind, brand, diameter_um, reference_cost_cents_per_kg) VALUES (?, ?, ?, ?, ?)',
      'PETG cinza (fictício)',
      'Filament',
      'Marca demo',
      1750,
      9990,
    )

    // Dois lotes do mesmo insumo: o mais antigo com 60 g livres, o mais novo com 1 kg.
    const lots = [
      { code: 'PLA-2026-10 (fictício)', receivedAt: '2026-10-01T10:00:00.000Z', mg: 60_000 },
      { code: 'PLA-2026-11 (fictício)', receivedAt: '2026-11-03T10:00:00.000Z', mg: 1_000_000 },
    ]
    for (const lot of lots) {
      const lotId = insert(
        db,
        `INSERT INTO material_lots (material_id, supplier_id, lot_code, received_at, initial_weight_mg, current_weight_mg, cost_cents_per_kg)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        plaId,
        supplierId,
        lot.code,
        lot.receivedAt,
        lot.mg,
        lot.mg,
        8990,
      )
      insert(db, 'INSERT INTO stock_items (material_id, material_lot_id, quantity_mg, reserved_mg) VALUES (?, ?, ?, 0)', plaId, lotId, lot.mg)
    }

    const profileId = insert(
      db,
      'INSERT INTO print_profiles (name, material_id, pieces_per_plate, seconds_per_plate, mg_per_plate) VALUES (?, ?, ?, ?, ?)',
      'Suporte demo, 4 por prancha (fictício)',
      plaId,
      4,
      3600,
      40_000,
    )
    const productId = insert(
      db,
      `INSERT INTO products (name, sku, default_sell_price_cents, default_print_profile_id, default_material_id, is_for_sale)
       VALUES (?, ?, ?, ?, ?, 1)`,
      'Suporte demo (fictício)',
      DEMO_SKU,
      2500,
      profileId,
      plaId,
    )
    insert(db, 'INSERT INTO product_colors (product_id, color_id) VALUES (?, ?)', productId, blackId)

    const printerSql = `INSERT INTO printers (name, model, cost_cents_per_hour, energy_wh_per_hour, maintenance_limit_hours,
      accumulated_seconds, preparation_seconds, is_active, operational_status) VALUES (?, ?, 400, 120, 200, 0, 600, 1, 'Available')`
    const mesaA = insert(db, printerSql, 'Mesa A', 'Modelo demo (fictício)')
    const mesaB = insert(db, printerSql, 'Mesa B', 'Modelo demo (fictício)')
    insert(db, 'INSERT INTO printer_materials (printer_id, material_id) VALUES (?, ?)', mesaA, plaId)
    insert(db, 'INSERT INTO printer_materials (printer_id, material_id) VALUES (?, ?)', mesaB, petgId)

    const customerId = insert(
      db,
      'INSERT INTO customers (name, email, created_at) VALUES (?, ?, ?)',
      'Cliente demo (fictício)',
      'cliente.demo@exemplo.invalid',
      now,
    )
    const orderSql = `INSERT INTO sales_orders (number, customer_id, commercial_status, promised_date, freight_cents, packaging_cents, notes, created_at)
      VALUES (?, ?, 'QuotePending', ?, 0, 0, ?, ?)`
    const lineSql = `INSERT INTO order_lines (sales_order_id, product_id, quantity, unit_price_cents, material_id, color_id)
      VALUES (?, ?, ?, 2500, ?, ?)`

    // Pedido do cenário 10 peças / 4 por prancha.
    const order1 = insert(db, orderSql, 'PED-DEMO-001', customerId, addDays(now, 7), 'Pedido de exemplo (fictício)', now)
    insert(db, lineSql, order1, productId, 10, plaId, blackId)

    // Pedido grande demais para o saldo: mostra a liberação recusada sem reserva parcial.
    const order2 = insert(
      db,
      orderSql,
      'PED-DEMO-002',
      customerId,
      addDays(now, 14),
      'Pedido de exemplo maior que o estoque (fictício)',
      now,
    )
    insert(db, lineSql, order2, productId, 1000, plaId, blackId)
  })
  return true
}
