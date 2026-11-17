import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, tokenFor } from '../helpers/test-app.ts'
import { buildScenario, type Scenario } from '../helpers/fixtures.ts'

let app: FastifyInstance

afterEach(async () => {
  await app.close()
})

async function setup(options: Parameters<typeof buildScenario>[1] = {}): Promise<Scenario> {
  const built = await buildTestApp()
  app = built.app
  await app.ready()
  return buildScenario(built.db, options)
}

const auth = async (role: Parameters<typeof tokenFor>[0]) => ({ authorization: `Bearer ${await tokenFor(role)}` })

describe('US1 pela API (quickstart seção 1)', () => {
  it('vendas confirma, produção libera 3 lotes e enfileira só em impressora compatível', async () => {
    const s = await setup({ orderStatus: 'QuotePending' })

    const confirm = await app.inject({
      method: 'PATCH',
      url: `/api/sales-orders/${s.orderId}/status`,
      headers: await auth('Sales'),
      payload: { status: 'Approved' },
    })
    expect(confirm.statusCode).toBe(200)
    expect(confirm.json().commercialStatus).toBe('Approved')

    const release = await app.inject({
      method: 'POST',
      url: `/api/sales-orders/${s.orderId}/lots/release`,
      headers: await auth('Production'),
    })
    expect(release.statusCode).toBe(201)
    const lots = release.json().lots as {
      id: number
      qtyPlanned: number
      plannedGrams: number
      plannedMinutes: number
      status: string
      releasedPiecesPerPlate: number
      releasedMinutesPerPlate: number
      releasedGramsPerPlate: number
    }[]
    expect(lots.map((l) => [l.qtyPlanned, l.plannedGrams, l.plannedMinutes, l.status])).toEqual([
      [4, 40, 60, 'Queued'],
      [4, 40, 60, 'Queued'],
      [2, 20, 30, 'Queued'],
    ])
    expect(lots.map((l) => [l.releasedPiecesPerPlate, l.releasedMinutesPerPlate, l.releasedGramsPerPlate])).toEqual([
      [4, 60, 40],
      [4, 60, 40],
      [4, 60, 40],
    ])

    const again = await app.inject({
      method: 'POST',
      url: `/api/sales-orders/${s.orderId}/lots/release`,
      headers: await auth('Production'),
    })
    expect(again.statusCode).toBe(409)
    expect(again.json().code).toBe('ALREADY_RELEASED')

    const first = lots[0] as { id: number }
    const mesaB = await app.inject({
      method: 'POST',
      url: `/api/lots/${first.id}/queue`,
      headers: await auth('Production'),
      payload: { printerId: s.printerBId, priority: 0 },
    })
    expect(mesaB.statusCode).toBe(409)
    expect(mesaB.json().code).toBe('PRINTER_INCOMPATIBLE')

    const mesaA = await app.inject({
      method: 'POST',
      url: `/api/lots/${first.id}/queue`,
      headers: await auth('Production'),
      payload: { printerId: s.printerAId, priority: 0 },
    })
    // T081: o lote já está na fila desde a liberação; atribuir a impressora atualiza o mesmo item.
    expect(mesaA.statusCode).toBe(200)
    expect(mesaA.json()).toMatchObject({ status: 'Queued', printerId: s.printerAId, position: 1 })

    const unassign = await app.inject({
      method: 'POST',
      url: `/api/lots/${(lots[1] as { id: number }).id}/queue`,
      headers: await auth('Production'),
      payload: { printerId: null, priority: 5 },
    })
    expect(unassign.statusCode).toBe(200)

    const queue = await app.inject({ method: 'GET', url: '/api/lots', headers: await auth('Operator') })
    expect(queue.statusCode).toBe(200)
    const items = queue.json() as {
      status: string
      printerName: string | null
      position: number
      priority: number
      reservedGrams: number
      missingMaterialG: number
      releasedPiecesPerPlate: number
    }[]
    // Nunca duplica o item: três lotes, três itens, posições preservadas.
    expect(items.map((l) => [l.status, l.printerName, l.position])).toEqual([
      ['Queued', 'Mesa A', 1],
      ['Queued', null, 2],
      ['Queued', null, 3],
    ])
    expect(items[1]?.priority).toBe(5)
    // T082: reserva e material faltante calculados.
    expect(items.map((l) => [l.reservedGrams, l.missingMaterialG, l.releasedPiecesPerPlate])).toEqual([
      [40, 0, 4],
      [40, 0, 4],
      [20, 0, 4],
    ])

    const detail = await app.inject({ method: 'GET', url: `/api/sales-orders/${s.orderId}`, headers: await auth('Sales') })
    expect(detail.statusCode).toBe(200)
    expect(detail.json().lots[1].reservations).toEqual([
      { materialLotCode: 'L1', grams: 20 },
      { materialLotCode: 'L2', grams: 20 },
    ])
  })

  it('saldo insuficiente devolve 409 com lotIndex, neededGrams e freeGrams', async () => {
    const s = await setup({ materialLotsMg: [60000] })
    const res = await app.inject({
      method: 'POST',
      url: `/api/sales-orders/${s.orderId}/lots/release`,
      headers: await auth('Production'),
    })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 'INSUFFICIENT_MATERIAL', lotIndex: 2, neededGrams: 40, freeGrams: 20 })
  })

  it('pedido cancelado não muda mais de estado', async () => {
    const s = await setup({ orderStatus: 'Cancelled' })
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/sales-orders/${s.orderId}/status`,
      headers: await auth('Sales'),
      payload: { status: 'Approved' },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('ORDER_CANCELLED')
  })

  it('papéis: vendas não libera lote; produção não confirma pedido', async () => {
    const s = await setup()
    const release = await app.inject({
      method: 'POST',
      url: `/api/sales-orders/${s.orderId}/lots/release`,
      headers: await auth('Sales'),
    })
    expect(release.statusCode).toBe(403)
    const patch = await app.inject({
      method: 'PATCH',
      url: `/api/sales-orders/${s.orderId}/status`,
      headers: await auth('Production'),
      payload: { status: 'Cancelled' },
    })
    expect(patch.statusCode).toBe(403)
  })

  it('lista impressoras com os materiais compatíveis', async () => {
    await setup()
    const res = await app.inject({ method: 'GET', url: '/api/printers', headers: await auth('Production') })
    expect(res.statusCode).toBe(200)
    const mesaA = res.json().find((p: { name: string }) => p.name === 'Mesa A')
    expect(mesaA).toMatchObject({
      operationalStatus: 'Available',
      hourRateExcludesFilamentAndEnergy: true,
      hourRateStatement: 'A taxa de hora-máquina não inclui filamento nem energia.',
    })
    expect(mesaA.compatibleMaterials.map((m: { name: string }) => m.name)).toEqual(['PLA teste'])
  })
})
