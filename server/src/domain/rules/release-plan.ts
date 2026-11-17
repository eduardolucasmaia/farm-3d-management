import type { CommercialOrderStatus } from '../enums.ts'
import { fail, ok, type Result } from '../result.ts'
import { allocateFifo, type Allocation, type FreeLot } from './fifo-reservation.ts'
import { splitLots } from './lot-split.ts'
import { canReleaseLots } from './sales-order-state.ts'

// Decide a liberação inteira de um pedido (FR-009, FR-011, FR-012). O caso de uso
// só carrega os dados, chama esta função e grava o plano (princípio I).

export interface ReleaseLineInput {
  orderLineId: number
  quantity: number
  materialId: number | null
  profile: { piecesPerPlate: number; secondsPerPlate: number; mgPerPlate: number } | null
  alreadyReleased: boolean
}

export interface PlannedReleaseLot {
  orderLineId: number
  lotIndex: number
  materialId: number
  pieces: number
  plannedMg: number
  plannedSeconds: number
  allocations: Allocation[]
}

export interface ReleaseInput {
  orderStatus: CommercialOrderStatus
  lines: readonly ReleaseLineInput[]
  /** Lotes de material com saldo livre, por material. */
  freeLotsByMaterial: ReadonlyMap<number, readonly FreeLot[]>
  /** Índice do primeiro lote novo dentro do pedido (lotes já existentes + 1). */
  firstLotIndex: number
}

export function planRelease(input: ReleaseInput): Result<PlannedReleaseLot[]> {
  const releasable = canReleaseLots(input.orderStatus)
  if (!releasable.ok) return releasable

  const pending = input.lines.filter((line) => !line.alreadyReleased)
  if (pending.length === 0) {
    return fail('ALREADY_RELEASED', 'Repetir a liberação já reservada é recusado.')
  }

  // Cópia do livre: cada lote planejado consome o saldo que o próximo enxerga.
  const free = new Map<number, FreeLot[]>()
  for (const [materialId, lots] of input.freeLotsByMaterial) free.set(materialId, lots.map((lot) => ({ ...lot })))

  const planned: PlannedReleaseLot[] = []
  let lotIndex = input.firstLotIndex
  for (const line of pending) {
    if (line.materialId === null) {
      return fail('MISSING_MATERIAL', 'A linha do pedido não tem material definido.')
    }
    if (line.profile === null) {
      return fail('MISSING_PROFILE', 'O modelo não tem perfil de produção (peças por prancha ausente).')
    }
    const split = splitLots(line.quantity, line.profile.piecesPerPlate, line.profile.secondsPerPlate, line.profile.mgPerPlate)
    if (!split.ok) return split

    const materialLots = free.get(line.materialId) ?? []
    for (const lot of split.value) {
      const allocation = allocateFifo(lot.plannedMg, materialLots)
      if (!allocation.ok) {
        return fail(allocation.code, allocation.message, { lotIndex, ...allocation.details })
      }
      for (const { stockItemId, mg } of allocation.value) {
        const source = materialLots.find((candidate) => candidate.stockItemId === stockItemId)
        if (source) source.freeMg -= mg
      }
      planned.push({
        orderLineId: line.orderLineId,
        lotIndex,
        materialId: line.materialId,
        pieces: lot.pieces,
        plannedMg: lot.plannedMg,
        plannedSeconds: lot.plannedSeconds,
        allocations: allocation.value,
      })
      lotIndex++
    }
  }
  return ok(planned)
}
