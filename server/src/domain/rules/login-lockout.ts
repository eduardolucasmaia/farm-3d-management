import { addSeconds, isBefore } from '../time.ts'

// research.md item 4, confirmado em 2026-11-17.
export const LOCKOUT_MAX_FAILURES = 5
export const LOCKOUT_SECONDS = 300

export interface LoginState {
  failedCount: number
  lockedUntil: string | null
}

export interface LoginDecision extends LoginState {
  allowed: boolean
}

/**
 * Decide uma tentativa de login. Durante o travamento recusa até a senha certa,
 * sem mexer no estado. A quinta falha seguida trava por 5 minutos.
 */
export function evaluateLogin(state: LoginState, passwordMatches: boolean, now: string): LoginDecision {
  if (state.lockedUntil !== null && isBefore(now, state.lockedUntil)) {
    return { allowed: false, failedCount: state.failedCount, lockedUntil: state.lockedUntil }
  }
  if (passwordMatches) {
    return { allowed: true, failedCount: 0, lockedUntil: null }
  }
  const failedCount = state.failedCount + 1
  if (failedCount >= LOCKOUT_MAX_FAILURES) {
    return { allowed: false, failedCount: 0, lockedUntil: addSeconds(now, LOCKOUT_SECONDS) }
  }
  return { allowed: false, failedCount, lockedUntil: null }
}
