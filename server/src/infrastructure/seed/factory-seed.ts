import { changeSalesOrderStatus } from '../../application/use-cases/change-sales-order-status.ts'
import { enqueueLot } from '../../application/use-cases/enqueue-lot.ts'
import { releaseLots } from '../../application/use-cases/release-lots.ts'
import { withTransaction, type Db } from '../db/database.ts'
import { CUSTOMERS, MATERIALS, ORDERS, PRINTER_GROUPS, PRINTER_OVERRIDES, PRODUCTS, SUPPLIERS } from './factory-dataset.ts'

// T089: carrega a fábrica simulada de factory-dataset.ts. Cadastros entram por SQL;
// pedidos, lotes, reservas e fila passam pelos casos de uso, então os dados já
// nascem coerentes com as regras (FIFO, reserva integral, compatibilidade).

export interface FactorySummary {
  printers: number
  materials: number
  materialLots: number
  products: number
  orders: number
  lots: number
}

const SEED_USER = 'seed-fabrica'
const DAY_MS = 86_400_000

function insert(db: Db, sql: string, ...params: (string | number | null)[]): number {
  return Number(db.prepare(sql).run(...params).lastInsertRowid)
}

/** Cria a fábrica se ainda não existe. Devolve o resumo, ou null se já existia. */
export function seedFactory(db: Db, now: string): FactorySummary | null {
  if (db.prepare('SELECT 1 FROM products WHERE sku = ?').get(PRODUCTS[0]?.[1] ?? '')) return null
  const nowMs = Date.parse(now)
  const instant = (daysAgo: number) => new Date(nowMs - daysAgo * DAY_MS).toISOString()
  const date = (daysAhead: number) => new Date(nowMs + daysAhead * DAY_MS).toISOString().slice(0, 10)

  return withTransaction(db, () => {
    const supplierIds = SUPPLIERS.map((name) => insert(db, 'INSERT INTO suppliers (name, created_at) VALUES (?, ?)', name, now))
    const customerIds = CUSTOMERS.map((name) => insert(db, 'INSERT INTO customers (name, created_at) VALUES (?, ?)', name, now))

    let materialLots = 0
    const materialIds = MATERIALS.map(([name, kind, diameterUm, centsPerKg, reorderMg, supplier, lots]) => {
      const materialId = insert(
        db,
        'INSERT INTO materials (name, kind, diameter_um, reference_cost_cents_per_kg, reorder_point_mg) VALUES (?, ?, ?, ?, ?)',
        name,
        kind,
        diameterUm,
        centsPerKg,
        reorderMg,
      )
      for (const [code, daysAgo, mg] of lots) {
        const lotId = insert(
          db,
          `INSERT INTO material_lots (material_id, supplier_id, lot_code, received_at, initial_weight_mg, current_weight_mg, cost_cents_per_kg)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          materialId,
          supplierIds[supplier] as number,
          code,
          instant(daysAgo),
          mg,
          mg,
          centsPerKg,
        )
        insert(db, 'INSERT INTO stock_items (material_id, material_lot_id, quantity_mg, reserved_mg) VALUES (?, ?, ?, 0)', materialId, lotId, mg)
        materialLots++
      }
      return materialId
    })

    const products = PRODUCTS.map(([name, sku, priceCents, material, pieces, seconds, mg]) => {
      const materialId = materialIds[material] as number
      const profileId = insert(
        db,
        'INSERT INTO print_profiles (name, material_id, pieces_per_plate, seconds_per_plate, mg_per_plate) VALUES (?, ?, ?, ?, ?)',
        `Perfil ${sku} (fictício)`,
        materialId,
        pieces,
        seconds,
        mg,
      )
      const id = insert(
        db,
        `INSERT INTO products (name, sku, default_sell_price_cents, default_print_profile_id, default_material_id, is_for_sale)
         VALUES (?, ?, ?, ?, ?, 1)`,
        name,
        sku,
        priceCents,
        profileId,
        materialId,
      )
      return { id, materialId, priceCents }
    })

    const printerIds: number[] = []
    for (const [prefix, quantity, model, centsPerHour, whPerHour, limitHours, prepSeconds, accepted] of PRINTER_GROUPS) {
      for (let n = 1; n <= quantity; n++) {
        const name = `${prefix}${String(n).padStart(2, '0')}`
        const [status, hours, active] = PRINTER_OVERRIDES[name] ?? ['Available', (n * 17) % Math.floor(limitHours / 2), true]
        const printerId = insert(
          db,
          `INSERT INTO printers (name, model, cost_cents_per_hour, energy_wh_per_hour, maintenance_limit_hours,
             accumulated_seconds, preparation_seconds, is_active, operational_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          name,
          model,
          centsPerHour,
          whPerHour,
          limitHours,
          hours * 3600,
          prepSeconds,
          active ? 1 : 0,
          status,
        )
        for (const material of accepted) {
          insert(db, 'INSERT INTO printer_materials (printer_id, material_id) VALUES (?, ?)', printerId, materialIds[material] as number)
        }
        printerIds.push(printerId)
      }
    }

    const assigned = new Set<number>()
    let lots = 0
    for (const [number, customer, daysAhead, target, lines] of ORDERS) {
      const orderId = insert(
        db,
        `INSERT INTO sales_orders (number, customer_id, commercial_status, promised_date, notes, created_at)
         VALUES (?, ?, 'QuotePending', ?, 'Pedido de exemplo (fictício)', ?)`,
        number,
        customerIds[customer] as number,
        date(daysAhead),
        now,
      )
      for (const [product, quantity] of lines) {
        const p = products[product] as (typeof products)[number]
        insert(
          db,
          'INSERT INTO order_lines (sales_order_id, product_id, quantity, unit_price_cents, material_id) VALUES (?, ?, ?, ?, ?)',
          orderId,
          p.id,
          quantity,
          p.priceCents,
          p.materialId,
        )
      }
      if (target === 'pending') continue

      const to = target === 'cancelled' ? 'Cancelled' : 'Approved'
      const changed = changeSalesOrderStatus(db, { salesOrderId: orderId, to })
      if (!changed.ok) throw new Error(`${number}: ${changed.message}`)
      if (target !== 'released') continue

      const released = releaseLots(db, { salesOrderId: orderId, userId: SEED_USER, now })
      if (!released.ok) throw new Error(`${number}: ${released.message}`)
      lots += released.value.length

      // O primeiro lote de cada linha recebe a primeira impressora que a regra aceitar.
      const seenLines = new Set<number>()
      for (const lot of released.value) {
        if (seenLines.has(lot.orderLineId)) continue
        seenLines.add(lot.orderLineId)
        for (const printerId of printerIds) {
          if (assigned.has(printerId)) continue
          if (enqueueLot(db, { lotId: lot.id, printerId, priority: 0, now }).ok) {
            assigned.add(printerId)
            break
          }
        }
      }
    }

    return {
      printers: printerIds.length,
      materials: materialIds.length,
      materialLots,
      products: products.length,
      orders: ORDERS.length,
      lots,
    }
  })
}
