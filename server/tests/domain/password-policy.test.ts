import { describe, expect, it } from 'vitest'
import { checkPasswordPolicy } from '../../src/domain/rules/password-policy.ts'

describe('política de senha (research.md item 4)', () => {
  it('aceita 6 ou mais caracteres com maiúscula, minúscula, dígito e símbolo', () => {
    expect(checkPasswordPolicy('Ab1!xy').ok).toBe(true)
    expect(checkPasswordPolicy('Farm3d@2026').ok).toBe(true)
  })

  it('recusa senha curta ou sem alguma das quatro classes', () => {
    expect(checkPasswordPolicy('Ab1!x').ok).toBe(false)
    expect(checkPasswordPolicy('ab1!xy').ok).toBe(false)
    expect(checkPasswordPolicy('AB1!XY').ok).toBe(false)
    expect(checkPasswordPolicy('Abc!xy').ok).toBe(false)
    expect(checkPasswordPolicy('Ab1xyz').ok).toBe(false)
  })

  it('devolve o código WEAK_PASSWORD na recusa', () => {
    const result = checkPasswordPolicy('curta')
    expect(result).toMatchObject({ ok: false, code: 'WEAK_PASSWORD' })
  })
})
