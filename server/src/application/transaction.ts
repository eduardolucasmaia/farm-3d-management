import { ok, type Failure, type Result } from '../domain/result.ts'
import { withTransaction, type Db } from '../infrastructure/db/database.ts'

// Caso de uso numa transação: recusa de regra desfaz tudo e volta como valor.

class AbortTransaction extends Error {
  readonly failure: Failure
  constructor(failure: Failure) {
    super(failure.message)
    this.failure = failure
  }
}

/** Interrompe a transação em curso com a recusa da regra. */
export function abort(failure: Failure): never {
  throw new AbortTransaction(failure)
}

export function transact<T>(db: Db, fn: () => T): Result<T> {
  try {
    return ok(withTransaction(db, fn))
  } catch (error) {
    if (error instanceof AbortTransaction) return error.failure
    throw error
  }
}
