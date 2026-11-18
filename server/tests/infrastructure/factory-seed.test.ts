import { describe, expect, it } from 'vitest'
import { seedFactory } from '../../src/infrastructure/seed/factory-seed.ts'
import { PrinterOperationalStatus } from '../../src/domain/enums.ts'
import { migratedDb } from '../helpers/test-app.ts'
import { count } from '../helpers/fixtures.ts'

const now = '2026-11-18T12:00:00.000Z'

function seeded() {
  const db = migratedDb()
  const summary = seedFactory(db, now)
  return { db, summary }
}

describe('fábrica simulada (T089)', () => {
  it('carrega uma vez só e devolve o resumo', () => {
    const { db, summary } = seeded()
    expect(summary).toEqual({ printers: 20, materials: 6, materialLots: 9, products: 6, orders: 11, lots: 20 })
    expect(seedFactory(db, now)).toBeNull()
    expect(count(db, 'printers')).toBe(20)
  })

  it('a frota cobre os seis estados operacionais e tem uma impressora inativa', () => {
    const { db } = seeded()
    const statuses = (db.prepare('SELECT DISTINCT operational_status AS s FROM printers').all() as { s: string }[]).map(
      (r) => r.s,
    )
    expect(statuses.sort()).toEqual(Object.values(PrinterOperationalStatus).sort())
    expect(count(db, 'printers', 'is_active = 0')).toBe(1)
    // Em manutenção só com as horas acumuladas no limite ou acima dele.
    expect(
      count(db, 'printers', "operational_status = 'InMaintenance' AND accumulated_seconds < maintenance_limit_hours * 3600"),
    ).toBe(0)
  })

  it('todo nome de exemplo leva a marca de fictício (princípio V)', () => {
    const { db } = seeded()
    for (const [table, column] of [
      ['printers', 'model'],
      ['materials', 'name'],
      ['material_lots', 'lot_code'],
      ['products', 'name'],
      ['customers', 'name'],
      ['suppliers', 'name'],
      ['sales_orders', 'notes'],
    ] as const) {
      expect(count(db, table, `${column} NOT LIKE '%(fictício)%'`), `${table}.${column}`).toBe(0)
    }
  })

  it('os pedidos cobrem os estados comerciais que o sistema já produz', () => {
    const { db } = seeded()
    const byStatus = Object.fromEntries(
      (
        db.prepare('SELECT commercial_status AS s, COUNT(*) AS c FROM sales_orders GROUP BY 1').all() as {
          s: string
          c: number
        }[]
      ).map((r) => [r.s, r.c]),
    )
    expect(byStatus).toEqual({ InProduction: 6, Approved: 2, QuotePending: 2, Cancelled: 1 })
    // Um pedido em produção com a data prometida vencida, para o painel de atraso.
    expect(count(db, 'sales_orders', "commercial_status = 'InProduction' AND promised_date < ?", now.slice(0, 10))).toBe(1)
  })

  it('todo lote está na fila com reserva integral, e o saldo fecha', () => {
    const { db } = seeded()
    expect(count(db, 'production_lots', "status <> 'Queued'")).toBe(0)
    expect(count(db, 'print_queue_items')).toBe(20)
    const missing = db
      .prepare(
        `SELECT COUNT(*) AS c FROM production_lots l
          WHERE l.planned_mg <> (SELECT COALESCE(SUM(r.reserved_mg), 0)
                                   FROM production_material_reservations r WHERE r.production_lot_id = l.id)`,
      )
      .get() as { c: number }
    expect(missing.c).toBe(0)
    const totals = db
      .prepare(
        `SELECT (SELECT SUM(reserved_mg) FROM stock_items) AS stock,
                (SELECT SUM(reserved_mg) FROM production_material_reservations) AS reservations,
                (SELECT SUM(quantity_mg) FROM stock_movements WHERE kind = 'Reserve') AS movements`,
      )
      .get() as { stock: number; reservations: number; movements: number }
    expect(totals.reservations).toBe(totals.stock)
    expect(totals.movements).toBe(totals.stock)
    expect(count(db, 'stock_items', 'reserved_mg > quantity_mg')).toBe(0)
  })

  it('lote só recebe impressora ativa, disponível e compatível', () => {
    const { db } = seeded()
    expect(count(db, 'print_queue_items', 'printer_id IS NOT NULL')).toBeGreaterThanOrEqual(6)
    const bad = db
      .prepare(
        `SELECT COUNT(*) AS c
           FROM print_queue_items q
           JOIN production_lots l ON l.id = q.production_lot_id
           JOIN printers p ON p.id = q.printer_id
          WHERE p.is_active = 0 OR p.operational_status <> 'Available'
             OR (EXISTS (SELECT 1 FROM printer_materials pm WHERE pm.printer_id = p.id)
                 AND NOT EXISTS (SELECT 1 FROM printer_materials pm
                                  WHERE pm.printer_id = p.id AND pm.material_id = l.material_id))`,
      )
      .get() as { c: number }
    expect(bad.c).toBe(0)
  })

  it('um material fica abaixo do ponto de reposição, para a sugestão de recompra', () => {
    const { db } = seeded()
    const below = db
      .prepare(
        `SELECT COUNT(*) AS c FROM materials m
          WHERE m.reorder_point_mg IS NOT NULL
            AND m.reorder_point_mg > (SELECT SUM(s.quantity_mg - s.reserved_mg) FROM stock_items s WHERE s.material_id = m.id)`,
      )
      .get() as { c: number }
    expect(below.c).toBeGreaterThanOrEqual(1)
  })
})
