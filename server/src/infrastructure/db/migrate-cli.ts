import { resolveDbPath } from '../config.ts'
import { openDatabase } from './database.ts'
import { applyMigrations } from './migrate.ts'

const dbPath = resolveDbPath(process.env)
const db = openDatabase(dbPath)
const applied = applyMigrations(db)
db.close()
console.log(applied.length > 0 ? `Migrações aplicadas em ${dbPath}: ${applied.join(', ')}` : `Banco já atualizado: ${dbPath}`)
