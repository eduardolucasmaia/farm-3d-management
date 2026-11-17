import { fail, ok, type Result } from '../result.ts'
import { mulDivCeil } from '../units.ts'

// FR-011; research.md item 6.

export interface PlannedLot {
  pieces: number
  plannedSeconds: number
  plannedMg: number
}

/**
 * Corta a quantidade em lotes de uma prancha cada. Quantidade de lotes =
 * teto(peças / peças por prancha). A prancha incompleta leva tempo e material
 * proporcionais, arredondados para cima.
 */
export function splitLots(
  pieces: number,
  piecesPerPlate: number,
  secondsPerPlate: number,
  mgPerPlate: number,
): Result<PlannedLot[]> {
  if (!Number.isInteger(pieces) || pieces < 1) {
    return fail('INVALID_QUANTITY', 'A quantidade de peças precisa ser um inteiro maior que zero.')
  }
  if (!Number.isInteger(piecesPerPlate) || piecesPerPlate < 1) {
    return fail('MISSING_PIECES_PER_PLATE', 'Peças por prancha ausente ou menor que 1.')
  }
  if (!(secondsPerPlate > 0) || !(mgPerPlate > 0)) {
    return fail('INVALID_PROFILE', 'Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero.')
  }
  const lots: PlannedLot[] = []
  for (let remaining = pieces; remaining > 0; remaining -= piecesPerPlate) {
    const lotPieces = Math.min(remaining, piecesPerPlate)
    lots.push(
      lotPieces === piecesPerPlate
        ? { pieces: lotPieces, plannedSeconds: secondsPerPlate, plannedMg: mgPerPlate }
        : {
            pieces: lotPieces,
            plannedSeconds: mulDivCeil(secondsPerPlate, lotPieces, piecesPerPlate),
            plannedMg: mulDivCeil(mgPerPlate, lotPieces, piecesPerPlate),
          },
    )
  }
  return ok(lots)
}
