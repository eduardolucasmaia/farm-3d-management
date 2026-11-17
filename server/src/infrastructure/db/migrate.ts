import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { withTransaction, type Db } from './database.ts'

export const defaultMigrationsDir = fileURLToPath(new URL('../../../migrations/', import.meta.url))

/**
 * Aplica, em ordem de nome, todo arquivo `.sql` ainda ausente de
 * `schema_migrations`, inclusive os de número menor que o último aplicado.
 * Devolve os nomes aplicados nesta chamada.
 */
export function applyMigrations(db: Db, dir: string = defaultMigrationsDir): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)
  const done = new Set(
    (db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[]).map((row) => row.name),
  )
  const pending = readdirSync(dir)
    .filter((name) => name.endsWith('.sql') && !done.has(name))
    .sort()
  for (const name of pending) {
    const sql = readFileSync(join(dir, name), 'utf8')
    withTransaction(db, () => {
      db.exec(sql)
      db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(
        name,
        new Date().toISOString(),
      )
    })
  }
  return pending
}
