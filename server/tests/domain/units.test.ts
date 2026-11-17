import { describe, expect, it } from 'vitest'
import { formatScaled, mulDivCeil, mulDivRoundHalfUp, parseScaled } from '../../src/domain/units.ts'

describe('parseScaled', () => {
  it('converte texto decimal em inteiro na escala', () => {
    expect(parseScaled('12.345', 3)).toEqual({ ok: true, value: 12345 })
    expect(parseScaled('0.1', 2)).toEqual({ ok: true, value: 10 })
    expect(parseScaled(12.5, 2)).toEqual({ ok: true, value: 1250 })
    expect(parseScaled('-1.5', 1)).toEqual({ ok: true, value: -15 })
    expect(parseScaled('7', 3)).toEqual({ ok: true, value: 7000 })
  })

  it('recusa casas além da escala e texto que não é número', () => {
    expect(parseScaled('12.3456', 3).ok).toBe(false)
    expect(parseScaled('abc', 2).ok).toBe(false)
    expect(parseScaled('', 2).ok).toBe(false)
    expect(parseScaled('1e3', 2).ok).toBe(false)
  })

  it('recusa valor que não cabe em inteiro seguro', () => {
    expect(parseScaled('99999999999999999', 3).ok).toBe(false)
  })
})

describe('formatScaled', () => {
  it('formata o inteiro com as casas da escala', () => {
    expect(formatScaled(13334, 3)).toBe('13.334')
    expect(formatScaled(1250, 2)).toBe('12.50')
    expect(formatScaled(5, 2)).toBe('0.05')
    expect(formatScaled(-15, 1)).toBe('-1.5')
    expect(formatScaled(42, 0)).toBe('42')
  })
})

describe('mulDivRoundHalfUp', () => {
  it('arredonda ao inteiro mais próximo, metade para cima', () => {
    expect(mulDivRoundHalfUp(5, 1, 10)).toBe(1)
    expect(mulDivRoundHalfUp(4, 1, 10)).toBe(0)
    expect(mulDivRoundHalfUp(15, 1, 10)).toBe(2)
    expect(mulDivRoundHalfUp(40000, 8990, 1_000_000)).toBe(360)
  })

  it('é exato quando o produto intermediário passa do inteiro seguro', () => {
    expect(mulDivRoundHalfUp(9_000_000_000, 9_000_000_000, 9_000_000_000)).toBe(9_000_000_000)
  })

  it('recusa resultado acima do inteiro seguro e divisor zero', () => {
    expect(() => mulDivRoundHalfUp(Number.MAX_SAFE_INTEGER, 10, 1)).toThrow()
    expect(() => mulDivRoundHalfUp(1, 1, 0)).toThrow()
  })
})

describe('mulDivCeil', () => {
  it('arredonda para cima', () => {
    expect(mulDivCeil(40000, 1, 3)).toBe(13334)
    expect(mulDivCeil(40000, 2, 4)).toBe(20000)
    expect(mulDivCeil(3600, 1, 3)).toBe(1200)
  })
})
