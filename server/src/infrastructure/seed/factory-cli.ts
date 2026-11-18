import { resolveDbPath } from '../config.ts'
import { openDatabase } from '../db/database.ts'
import { applyMigrations } from '../db/migrate.ts'
import { seedFactory } from './factory-seed.ts'

// npm run seed:factory --workspace server: carrega a fábrica simulada (dados fictícios).
if (process.env.NODE_ENV !== 'development') {
  console.error('A fábrica simulada só é carregada com NODE_ENV=development.')
  process.exit(1)
}
const dbPath = resolveDbPath(process.env)
const db = openDatabase(dbPath)
applyMigrations(db)
const summary = seedFactory(db, new Date().toISOString())
db.close()
console.log(
  summary
    ? `Fábrica simulada (fictícia) criada em ${dbPath}: ${JSON.stringify(summary)}`
    : `A fábrica simulada já existe em ${dbPath}; nada foi alterado.`,
)
