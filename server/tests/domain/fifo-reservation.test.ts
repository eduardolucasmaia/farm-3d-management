import { describe, expect, it } from 'vitest'
import { allocateFifo, type FreeLot } from '../../src/domain/rules/fifo-reservation.ts'

const older: FreeLot = { stockItemId: 11, materialLotId: 1, receivedAt: '2026-10-01T10:00:00.000Z', freeMg: 60000 }
const newer: FreeLot = { stockItemId: 12, materialLotId: 2, receivedAt: '2026-11-01T10:00:00.000Z', freeMg: 1000000 }

describe('allocateFifo (FR-012)', () => {
  it('aloca primeiro o lote de material recebido antes', () => {
    expect(allocateFifo(40000, [newer, older])).toEqual({ ok: true, value: [{ stockItemId: 11, mg: 40000 }] })
  })

  it('atravessa lotes até cobrir o necessário', () => {
    expect(allocateFifo(100000, [newer, older])).toEqual({
      ok: true,
      value: [
        { stockItemId: 11, mg: 60000 },
        { stockItemId: 12, mg: 40000 },
      ],
    })
  })

  it('no empate de data, o menor id de lote de material vem primeiro', () => {
    const a: FreeLot = { ...older, stockItemId: 21, materialLotId: 7 }
    const b: FreeLot = { ...older, stockItemId: 22, materialLotId: 3 }
    expect(allocateFifo(10000, [a, b])).toEqual({ ok: true, value: [{ stockItemId: 22, mg: 10000 }] })
  })

  it('ignora lote sem saldo livre', () => {
    const empty: FreeLot = { ...older, freeMg: 0 }
    expect(allocateFifo(10000, [empty, newer])).toEqual({ ok: true, value: [{ stockItemId: 12, mg: 10000 }] })
  })

  it('saldo que não cobre devolve recusa e nenhuma alocação', () => {
    expect(allocateFifo(70000, [older])).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_MATERIAL',
      details: { neededMg: 70000, freeMg: 60000 },
    })
  })

  it('recusa quantidade zero', () => {
    expect(allocateFifo(0, [older])).toMatchObject({ ok: false, code: 'INVALID_QUANTITY' })
  })
})
