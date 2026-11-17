import { describe, expect, it } from 'vitest'
import { releaseLots } from '../../src/application/use-cases/release-lots.ts'
import { migratedDb } from '../helpers/test-app.ts'
import { buildScenario, count, reservedMg } from '../helpers/fixtures.ts'

const now = '2026-11-17T12:00:00.000Z'
const userId = 'user-producao'

describe('releaseLots (FR-011, FR-012; princípio IV)', () => {
  it('cenário 10/4: três lotes liberados, reserva FIFO atravessando lotes de material', () => {
    const db = migratedDb()
    const s = buildScenario(db, { materialLotsMg: [60000, 1000000] })
    const result = releaseLots(db, { salesOrderId: s.orderId, userId, now })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.map((l) => [l.lotIndex, l.qtyPlanned, l.plannedMg, l.plannedSeconds, l.status])).toEqual([
      [1, 4, 40000, 3600, 'Released'],
      [2, 4, 40000, 3600, 'Released'],
      [3, 2, 20000, 1800, 'Released'],
    ])
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
      code: 'INSUFFICIENT_STOCK',
      details: { lotIndex: 2, neededMg: 40000, freeMg: 20000 },
    })
    expect(count(db, 'production_lots')).toBe(0)
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

  it('pedido inexistente devolve ORDER_NOT_FOUND', () => {
    const db = migratedDb()
    expect(releaseLots(db, { salesOrderId: 999, userId, now })).toMatchObject({ ok: false, code: 'ORDER_NOT_FOUND' })
  })
})
