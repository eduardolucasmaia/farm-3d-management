import type { ProductionLotStatus } from '../enums.ts'
import { fail, ok, type Result } from '../result.ts'

// Transições do lote de produção (data-model.md). T028 cobre enfileirar e T081 a atribuição
// na fila; T054 acrescenta iniciar, pausar, retomar, concluir, retirada, falhar e cancelar.

export type LotEvent = 'enqueue'

const TRANSITIONS: Record<LotEvent, Partial<Record<ProductionLotStatus, ProductionLotStatus>>> = {
  enqueue: { Released: 'Queued' },
}

export function transitionLot(from: ProductionLotStatus, event: LotEvent): Result<ProductionLotStatus> {
  const to = TRANSITIONS[event][from]
  return to ? ok(to) : fail('INVALID_LOT_TRANSITION', `Lote em ${from} não aceita o evento ${event}.`)
}

/**
 * O que fazer com o item de fila ao atribuir impressora ou prioridade (contracts/producao.md,
 * POST /api/lots/{id}/queue): lote liberado sem item cria o item; com item, atualiza o mesmo.
 * Nunca duplica o item ativo do lote.
 */
export function queueAction(status: ProductionLotStatus, hasQueueItem: boolean): Result<'create' | 'update'> {
  if (status !== 'Released' && status !== 'Queued') {
    return fail('INVALID_LOT_TRANSITION', `Lote em ${status} não aceita atribuição na fila.`)
  }
  if (hasQueueItem) return ok('update')
  if (status === 'Queued') {
    return fail('QUEUE_ITEM_MISSING', 'Lote na fila sem item de fila ativo.')
  }
  return ok('create')
}
