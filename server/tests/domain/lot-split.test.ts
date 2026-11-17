import { describe, expect, it } from 'vitest'
import { splitLots } from '../../src/domain/rules/lot-split.ts'

describe('splitLots (FR-011)', () => {
  it('10 peças com 4 por prancha produzem 3 lotes, o último com metade do tempo e do material', () => {
    expect(splitLots(10, 4, 3600, 40000)).toEqual({
      ok: true,
      value: [
        { pieces: 4, plannedSeconds: 3600, plannedMg: 40000 },
        { pieces: 4, plannedSeconds: 3600, plannedMg: 40000 },
        { pieces: 2, plannedSeconds: 1800, plannedMg: 20000 },
      ],
    })
  })

  it('quantidade que fecha prancha não gera lote parcial', () => {
    const result = splitLots(8, 4, 3600, 40000)
    expect(result.ok && result.value).toHaveLength(2)
  })

  it('prancha parcial arredonda tempo e material para cima', () => {
    const result = splitLots(10, 3, 3600, 40000)
    expect(result.ok && result.value.at(-1)).toEqual({ pieces: 1, plannedSeconds: 1200, plannedMg: 13334 })
  })

  it('recusa peças por prancha menor que 1 ou fracionária', () => {
    expect(splitLots(10, 0, 3600, 40000)).toMatchObject({ ok: false, code: 'MISSING_PIECES_PER_PLATE' })
    expect(splitLots(10, 1.5, 3600, 40000)).toMatchObject({ ok: false, code: 'MISSING_PIECES_PER_PLATE' })
  })

  it('recusa quantidade zero ou negativa e perfil com tempo ou material zero', () => {
    expect(splitLots(0, 4, 3600, 40000)).toMatchObject({ ok: false, code: 'INVALID_QUANTITY' })
    expect(splitLots(10, 4, 0, 40000)).toMatchObject({ ok: false, code: 'INVALID_PROFILE' })
    expect(splitLots(10, 4, 3600, 0)).toMatchObject({ ok: false, code: 'INVALID_PROFILE' })
  })
})
