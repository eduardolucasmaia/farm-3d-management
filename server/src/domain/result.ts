/**
 * Resultado de uma regra de domínio. Recusa de negócio é valor, não exceção
 * (research.md item 15). Exceção fica para erro de programação.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; code: string; message: string }

export type Failure = { ok: false; code: string; message: string }

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value }
}

export function fail(code: string, message: string): Failure {
  return { ok: false, code, message }
}
