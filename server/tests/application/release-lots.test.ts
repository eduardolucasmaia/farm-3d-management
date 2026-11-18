import { describe, expect, it } from 'vitest'
import { releaseLots } from '../../src/application/use-cases/release-lots.ts'
import { migratedDb } from '../helpers/test-app.ts'
import { buildScenario, count, reservedMg } from '../helpers/fixtures.ts'

const now = '2026-11-17T12:00:00.000Z'
const userId = 'user-producao'

describe('releaseLots (FR-011, FR-012; princípio IV)', () => {
  it('cenário 10/4: três lotes na fila, reserva FIFO atravessando lotes de material', () => {
    const db = migratedDb()
    const s = buildScenario(db, { materialLotsMg: [60000, 1000000] })
    const result = releaseLots(db, { salesOrderId: s.orderId, userId, now })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.map((l) => [l.lotIndex, l.qtyPlanned, l.plannedMg, l.plannedSeconds, l.status])).toEqual([
      [1, 4, 40000, 3600, 'Queued'],
      [2, 4, 40000, 3600, 'Queued'],
      [3, 2, 20000, 1800, 'Queued'],
    ])
    // T080: a liberação já enfileira, sem impressora, na mesma transação.
    expect(count(db, 'print_queue_items', 'printer_id IS NULL')).toBe(3)
    expect(count(db, 'production_lots', "status = 'Queued'")).toBe(3)
    // T080: parâmetros da prancha preservados no lote.
    expect(result.value.map((l) => [l.releasedPiecesPerPlate, l.releasedSecondsPerPlate, l.releasedMgPerPlate])).toEqual([
      [4, 3600, 40000],
      [4, 3600, 40000],
      [4, 3600, 40000],
    ])
    expect(
      count(
        db,
        'production_lots',
        'released_pieces_per_plate = 4 AND released_seconds_per_plate = 3600 AND released_mg_per_plate = 40000',
      ),
    ).toBe(3)
    const [older, newer] = s.stockItemIds as [number, number]
    expect(reservedMg(db, older)).toBe(60000)
    expect(reservedMg(db, newer)).toBe(40000)
    expect(count(db, 'production_material_reservations')).toBe(4)
    expect(count(db, 'stock_movements', "kind = 'Reserve'")).toBe(4)
    expect(
      (db.prepare("SELECT SUM(quantity_mg) AS s FROM stock_movements WHERE kind = 'Reserve'").get() as { s: number }).s,
    ).toBe(100000)
    expect(count(db, 'sales_orders', "id = ? AND commercial_status = 'InProduction'", s.orderId)).toBe(1)
  })

  it('saldo que acaba no meio do pedido desfaz tudo: nenhuma reserva parcial', () => {
    const db = migratedDb()
    const s = buildScenario(db, { materialLotsMg: [60000] })
    const result = releaseLots(db, { salesOrderId: s.orderId, userId, now })
    expect(result).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_MATERIAL',
      details: { lotIndex: 2, neededMg: 40000, freeMg: 20000 },
    })
    expect(count(db, 'production_lots')).toBe(0)
    expect(count(db, 'print_queue_items')).toBe(0)
    expect(count(db, 'production_material_reservations')).toBe(0)
    expect(count(db, 'stock_movements')).toBe(0)
    expect(reservedMg(db, s.stockItemIds[0] as number)).toBe(0)
    expect(count(db, 'sales_orders', "id = ? AND commercial_status = 'Approved'", s.orderId)).toBe(1)
  })

  it('repetir a liberação é recusado e o reservado não dobra', () => {
    const db = migratedDb()
    const s = buildScenario(db)
    expect(releaseLots(db, { salesOrderId: s.orderId, userId, now }).ok).toBe(true)
    const again = releaseLots(db, { salesOrderId: s.orderId, userId, now })
    expect(again).toMatchObject({ ok: false, code: 'ALREADY_RELEASED' })
    expect(count(db, 'production_lots')).toBe(3)
    expect(reservedMg(db, s.stockItemIds[0] as number) + reservedMg(db, s.stockItemIds[1] as number)).toBe(100000)
  })

  it('pedido em confirmação pendente ou cancelado não gera lote', () => {
    for (const orderStatus of ['QuotePending', 'Cancelled'] as const) {
      const db = migratedDb()
      const s = buildScenario(db, { orderStatus })
      expect(releaseLots(db, { salesOrderId: s.orderId, userId, now })).toMatchObject({
        ok: false,
        code: 'ORDER_NOT_RELEASABLE',
      })
      expect(count(db, 'production_lots')).toBe(0)
    }
  })

  it('modelo sem perfil de produção não libera', () => {
    const db = migratedDb()
    const s = buildScenario(db, { withProfile: false })
    expect(releaseLots(db, { salesOrderId: s.orderId, userId, now })).toMatchObject({
      ok: false,
      code: 'MISSING_PROFILE',
    })
  })

  it('T083: editar o perfil não muda lotes liberados; liberação nova usa o perfil novo (quickstart 1, passos 7 e 8)', () => {
    const db = migratedDb()
    const s = buildScenario(db, { materialLotsMg: [60000, 1000000] })
    expect(releaseLots(db, { salesOrderId: s.orderId, userId, now }).ok).toBe(true)
    const before = db.prepare('SELECT * FROM production_lots ORDER BY id').all()
    const reservedBefore = db.prepare('SELECT * FROM production_material_reservations ORDER BY id').all()

    db.prepare('UPDATE print_profiles SET pieces_per_plate = 5, seconds_per_plate = 5400, mg_per_plate = 50000').run()

    expect(db.prepare('SELECT * FROM production_lots ORDER BY id').all()).toEqual(before)
    expect(db.prepare('SELECT * FROM production_material_reservations ORDER BY id').all()).toEqual(reservedBefore)

    const customerId = (db.prepare('SELECT customer_id AS c FROM sales_orders WHERE id = ?').get(s.orderId) as { c: number }).c
    const order2 = Number(
      db
        .prepare(
          `INSERT INTO sales_orders (number, customer_id, commercial_status, promised_date, created_at)
           VALUES ('PED-T-2', ?, 'Approved', '2026-11-30', ?)`,
        )
        .run(customerId, now).lastInsertRowid,
    )
    db.prepare(
      'INSERT INTO order_lines (sales_order_id, product_id, quantity, unit_price_cents, material_id) VALUES (?, ?, 10, 2500, ?)',
    ).run(order2, s.productId, s.materialId)
    const second = releaseLots(db, { salesOrderId: order2, userId, now })
    expect(second.ok && second.value.map((l) => [l.qtyPlanned, l.plannedSeconds, l.plannedMg, l.releasedPiecesPerPlate])).toEqual([
      [5, 5400, 50000, 5],
      [5, 5400, 50000, 5],
    ])
  })

  it('pedido inexistente devolve ORDER_NOT_FOUND', () => {
    const db = migratedDb()
    expect(releaseLots(db, { salesOrderId: 999, userId, now })).toMatchObject({ ok: false, code: 'ORDER_NOT_FOUND' })
  })
})
