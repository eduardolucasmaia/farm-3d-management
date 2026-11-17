import { describe, expect, it } from 'vitest'
import { seedDemo } from '../../src/infrastructure/seed/demo-seed.ts'
import { releaseLots } from '../../src/application/use-cases/release-lots.ts'
import { changeSalesOrderStatus } from '../../src/application/use-cases/change-sales-order-status.ts'
import { migratedDb } from '../helpers/test-app.ts'
import { count } from '../helpers/fixtures.ts'

const now = '2026-11-17T12:00:00.000Z'

function orderId(db: ReturnType<typeof migratedDb>, number: string): number {
  return (db.prepare('SELECT id FROM sales_orders WHERE number = ?').get(number) as { id: number }).id
}

describe('semente de demonstração (T030)', () => {
  it('cria uma vez só, com nomes marcados como fictícios', () => {
    const db = migratedDb()
    expect(seedDemo(db, now)).toBe(true)
    expect(seedDemo(db, now)).toBe(false)
    expect(count(db, 'products', "name LIKE '%(fictício)%'")).toBe(1)
    expect(count(db, 'printers')).toBe(2)
  })

  it('reproduz o roteiro da seção 1 do quickstart', () => {
    const db = migratedDb()
    seedDemo(db, now)
    const first = orderId(db, 'PED-DEMO-001')
    const second = orderId(db, 'PED-DEMO-002')

    expect(changeSalesOrderStatus(db, { salesOrderId: first, to: 'Approved' }).ok).toBe(true)
    const released = releaseLots(db, { salesOrderId: first, userId: 'u', now })
    expect(released.ok && released.value.map((l) => l.qtyPlanned)).toEqual([4, 4, 2])

    expect(changeSalesOrderStatus(db, { salesOrderId: second, to: 'Approved' }).ok).toBe(true)
    expect(releaseLots(db, { salesOrderId: second, userId: 'u', now })).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_STOCK',
    })
    expect(count(db, 'production_lots', 'sales_order_id = ?', second)).toBe(0)
    expect(count(db, 'production_material_reservations')).toBe(4)
  })
})
