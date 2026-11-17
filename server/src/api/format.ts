import { mulDivRoundHalfUp, toDecimal } from '../domain/units.ts'

// Conversão das unidades inteiras do domínio para as unidades humanas dos
// contratos (data-model.md, "Unidades e representação"). Só a API usa.

export const grams = (mg: number): number => toDecimal(mg, 3)
export const minutes = (seconds: number): number => toDecimal(mulDivRoundHalfUp(seconds, 100, 60), 2)
export const reais = (cents: number): number => toDecimal(cents, 2)

/** Status HTTP de uma recusa: *_NOT_FOUND vira 404; o resto, 409 (conflito com o estado). */
export function statusForCode(code: string, overrides: Record<string, number> = {}): number {
  return overrides[code] ?? (code.endsWith('_NOT_FOUND') ? 404 : 409)
}
