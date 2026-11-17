/**
 * Resultado de uma regra de domínio. Recusa de negócio é valor, não exceção
 * (research.md item 15). Exceção fica para erro de programação.
 * `details` carrega dados que o contrato devolve junto da recusa.
 */
export type Failure = { ok: false; code: string; message: string; details?: Record<string, number | string> }

export type Result<T> = { ok: true; value: T } | Failure

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value }
}

export function fail(code: string, message: string, details?: Record<string, number | string>): Failure {
  return details ? { ok: false, code, message, details } : { ok: false, code, message }
}
