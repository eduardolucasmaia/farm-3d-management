import { describe, expect, it } from 'vitest'
import { queueAction, transitionLot } from '../../src/domain/rules/lot-state.ts'

// T028 cobre enfileirar; T081 cobre a atribuição na fila. T053 acrescenta as transições de execução.
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

describe('queueAction (T081)', () => {
  it('lote liberado sem item de fila cria o item', () => {
    expect(queueAction('Released', false)).toEqual({ ok: true, value: 'create' })
  })

  it('lote já na fila só atualiza o item existente', () => {
    expect(queueAction('Queued', true)).toEqual({ ok: true, value: 'update' })
  })

  it('nunca duplica: lote liberado que já tem item atualiza', () => {
    expect(queueAction('Released', true)).toEqual({ ok: true, value: 'update' })
  })

  it('recusa lote fora de Released ou Queued, e Queued sem item', () => {
    for (const status of ['AwaitingPlanning', 'Printing', 'Paused', 'Completed', 'Failed', 'Cancelled'] as const) {
      expect(queueAction(status, false)).toMatchObject({ ok: false, code: 'INVALID_LOT_TRANSITION' })
    }
    expect(queueAction('Queued', false)).toMatchObject({ ok: false, code: 'QUEUE_ITEM_MISSING' })
  })
})
