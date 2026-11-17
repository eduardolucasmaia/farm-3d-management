import { describe, expect, it } from 'vitest'
import { evaluateLogin, LOCKOUT_MAX_FAILURES, LOCKOUT_SECONDS } from '../../src/domain/rules/login-lockout.ts'

const now = '2026-11-17T12:00:00.000Z'

describe('travamento de login (research.md item 4)', () => {
  it('usa 5 falhas e 5 minutos', () => {
    expect(LOCKOUT_MAX_FAILURES).toBe(5)
    expect(LOCKOUT_SECONDS).toBe(300)
  })

  it('login certo sem travamento passa e zera o contador', () => {
    const decision = evaluateLogin({ failedCount: 3, lockedUntil: null }, true, now)
    expect(decision).toEqual({ allowed: true, failedCount: 0, lockedUntil: null })
  })

  it('falha soma ao contador sem travar antes da quinta', () => {
    const decision = evaluateLogin({ failedCount: 3, lockedUntil: null }, false, now)
    expect(decision).toEqual({ allowed: false, failedCount: 4, lockedUntil: null })
  })

  it('a quinta falha trava por 5 minutos e zera o contador', () => {
    const decision = evaluateLogin({ failedCount: 4, lockedUntil: null }, false, now)
    expect(decision).toEqual({ allowed: false, failedCount: 0, lockedUntil: '2026-11-17T12:05:00.000Z' })
  })

  it('durante o travamento recusa até a senha certa, sem mudar o travamento', () => {
    const state = { failedCount: 0, lockedUntil: '2026-11-17T12:05:00.000Z' }
    expect(evaluateLogin(state, true, now)).toEqual({ allowed: false, ...state })
    expect(evaluateLogin(state, false, now)).toEqual({ allowed: false, ...state })
  })

  it('depois do travamento volta a aceitar a senha certa', () => {
    const state = { failedCount: 0, lockedUntil: '2026-11-17T11:59:59.000Z' }
    expect(evaluateLogin(state, true, now)).toEqual({ allowed: true, failedCount: 0, lockedUntil: null })
  })
})
