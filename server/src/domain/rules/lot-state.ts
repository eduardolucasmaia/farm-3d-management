import type { ProductionLotStatus } from '../enums.ts'
import { fail, ok, type Result } from '../result.ts'

// Transições do lote de produção (data-model.md). T028 cobre enfileirar;
// T054 acrescenta iniciar, pausar, retomar, concluir, retirada, falhar e cancelar.

export type LotEvent = 'enqueue'

const TRANSITIONS: Record<LotEvent, Partial<Record<ProductionLotStatus, ProductionLotStatus>>> = {
  enqueue: { Released: 'Queued' },
}

export function transitionLot(from: ProductionLotStatus, event: LotEvent): Result<ProductionLotStatus> {
  const to = TRANSITIONS[event][from]
  return to ? ok(to) : fail('INVALID_LOT_TRANSITION', `Lote em ${from} não aceita o evento ${event}.`)
}
