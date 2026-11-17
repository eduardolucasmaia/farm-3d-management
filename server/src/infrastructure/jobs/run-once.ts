import { resolveDbPath } from '../config.ts'
import { openDatabase } from '../db/database.ts'
import { applyMigrations } from '../db/migrate.ts'
import { runHourlyPass } from './hourly-farm-job.ts'

// npm run job:hourly --workspace server: uma passagem do processamento periódico.
const db = openDatabase(resolveDbPath(process.env))
applyMigrations(db)
const report = runHourlyPass(db, new Date().toISOString())
db.close()
console.log('Passagem periódica concluída:', JSON.stringify(report))
