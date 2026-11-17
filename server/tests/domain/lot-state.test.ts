import { describe, expect, it } from 'vitest'
import { transitionLot } from '../../src/domain/rules/lot-state.ts'

// T028 cobre só enfileirar. T053 acrescenta as transições de execução.
describe('transitionLot: enfileirar', () => {
  it('lote liberado vai para a fila', () => {
    expect(transitionLot('Released', 'enqueue')).toEqual({ ok: true, value: 'Queued' })
  })

  it('recusa enfileirar lote em outro estado', () => {
    for (const from of ['AwaitingPlanning', 'Queued', 'Printing', 'Completed', 'Cancelled'] as const) {
      expect(transitionLot(from, 'enqueue')).toMatchObject({ ok: false, code: 'INVALID_LOT_TRANSITION' })
    }
  })
})
