import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// Único diretório que importa node:sqlite (research.md item 3).

export type Db = DatabaseSync

export function openDatabase(path: string): Db {
  const inMemory = path === ':memory:'
  if (!inMemory) mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON')
  if (!inMemory) {
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA busy_timeout = 5000')
  }
  return db
}

const depth = new WeakMap<Db, number>()

/**
 * Executa `fn` numa transação: COMMIT se terminar, ROLLBACK se lançar.
 * `fn` MUST ser síncrona; função que devolve Promise é desfeita e recusada.
 * Chamada aninhada participa da transação de fora.
 */
export function withTransaction<T>(db: Db, fn: () => T): T {
  const current = depth.get(db) ?? 0
  if (current > 0) {
    depth.set(db, current + 1)
    try {
      return assertSync(fn())
    } finally {
      depth.set(db, current)
    }
  }
  db.exec('BEGIN IMMEDIATE')
  depth.set(db, 1)
  try {
    const result = assertSync(fn())
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  } finally {
    depth.set(db, 0)
  }
}

function assertSync<T>(value: T): T {
  if (value !== null && typeof value === 'object' && typeof (value as { then?: unknown }).then === 'function') {
    throw new Error('withTransaction exige função síncrona; não use await dentro da transação.')
  }
  return value
}
