import { fail, ok, type Result } from '../result.ts'

// FR-012; research.md item 7.

export interface FreeLot {
  stockItemId: number
  materialLotId: number
  /** Instante ISO-8601 UTC. */
  receivedAt: string
  freeMg: number
}

export interface Allocation {
  stockItemId: number
  mg: number
}

/**
 * Aloca `neededMg` do lote de material mais antigo para o mais novo
 * (desempate pelo id do lote de material). Se o livre somado não cobre,
 * recusa sem alocar nada: "Saldo insuficiente recusa a liberação inteira, sem reserva parcial."
 */
export function allocateFifo(neededMg: number, lots: readonly FreeLot[]): Result<Allocation[]> {
  if (!Number.isInteger(neededMg) || neededMg <= 0) {
    return fail('INVALID_QUANTITY', 'A quantidade a reservar precisa ser maior que zero.')
  }
  const ordered = lots
    .filter((lot) => lot.freeMg > 0)
    .sort((a, b) =>
      a.receivedAt === b.receivedAt ? a.materialLotId - b.materialLotId : a.receivedAt < b.receivedAt ? -1 : 1,
    )
  const freeMg = ordered.reduce((sum, lot) => sum + lot.freeMg, 0)
  if (freeMg < neededMg) {
    return fail('INSUFFICIENT_STOCK', 'Saldo insuficiente recusa a liberação inteira, sem reserva parcial.', {
      neededMg,
      freeMg,
    })
  }
  const allocations: Allocation[] = []
  let remaining = neededMg
  for (const lot of ordered) {
    if (remaining === 0) break
    const mg = Math.min(lot.freeMg, remaining)
    allocations.push({ stockItemId: lot.stockItemId, mg })
    remaining -= mg
  }
  return ok(allocations)
}
