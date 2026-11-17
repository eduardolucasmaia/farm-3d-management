import { fail, ok, type Result } from './result.ts'

// Aritmética inteira em escala fixa (research.md item 11; data-model.md
// "Unidades e representação"). Nenhum outro arquivo divide dinheiro, peso ou tempo.

const MAX = BigInt(Number.MAX_SAFE_INTEGER)
const DECIMAL = /^(-)?(\d+)(?:\.(\d+))?$/

function toSafeNumber(value: bigint): number {
  if (value > MAX || value < -MAX) {
    throw new RangeError('Resultado fora do inteiro seguro.')
  }
  return Number(value)
}

function assertNonNegativeIntegers(...values: number[]): void {
  for (const v of values) {
    if (!Number.isSafeInteger(v) || v < 0) {
      throw new RangeError(`Esperado inteiro seguro não negativo, recebido ${v}.`)
    }
  }
}

/**
 * Lê um decimal pela forma de texto e devolve o inteiro na escala `scale`.
 * Recusa notação científica, texto não numérico e casas além da escala.
 */
export function parseScaled(value: string | number, scale: number): Result<number> {
  const text = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : value.trim()
  const match = DECIMAL.exec(text)
  if (!match) return fail('INVALID_NUMBER', `Valor numérico inválido: '${text}'.`)
  const [, sign, intPart = '0', fracPart = ''] = match
  if (fracPart.length > scale) {
    return fail('TOO_MANY_DECIMALS', `Use no máximo ${scale} casas decimais.`)
  }
  const magnitude = BigInt(intPart) * 10n ** BigInt(scale) + BigInt(fracPart.padEnd(scale, '0') || '0')
  if (magnitude > MAX) return fail('NUMBER_TOO_LARGE', 'Valor numérico grande demais.')
  return ok(Number(sign ? -magnitude : magnitude))
}

/** Formata o inteiro na escala `scale` como texto decimal com ponto. */
export function formatScaled(value: number, scale: number): string {
  if (!Number.isSafeInteger(value)) throw new RangeError(`Esperado inteiro seguro, recebido ${value}.`)
  const negative = value < 0
  const abs = BigInt(Math.abs(value))
  if (scale === 0) return `${negative ? '-' : ''}${abs}`
  const factor = 10n ** BigInt(scale)
  const intPart = abs / factor
  const fracPart = (abs % factor).toString().padStart(scale, '0')
  return `${negative ? '-' : ''}${intPart}.${fracPart}`
}

/** Converte para número decimal de JSON (só na fronteira da API). */
export function toDecimal(value: number, scale: number): number {
  return Number(formatScaled(value, scale))
}

/** a × b ÷ c, arredondado ao inteiro mais próximo, metade para cima. */
export function mulDivRoundHalfUp(a: number, b: number, c: number): number {
  assertNonNegativeIntegers(a, b, c)
  if (c === 0) throw new RangeError('Divisão por zero.')
  const product = BigInt(a) * BigInt(b)
  const divisor = BigInt(c)
  return toSafeNumber((2n * product + divisor) / (2n * divisor))
}

/** a × b ÷ c, arredondado para cima. */
export function mulDivCeil(a: number, b: number, c: number): number {
  assertNonNegativeIntegers(a, b, c)
  if (c === 0) throw new RangeError('Divisão por zero.')
  const product = BigInt(a) * BigInt(b)
  const divisor = BigInt(c)
  return toSafeNumber((product + divisor - 1n) / divisor)
}
