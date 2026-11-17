import { loadConfig } from '../infrastructure/config.ts'
import { openDatabase } from '../infrastructure/db/database.ts'
import { applyMigrations } from '../infrastructure/db/migrate.ts'
import { HOURLY_INTERVAL_MS, runHourlyPass } from '../infrastructure/jobs/hourly-farm-job.ts'
import { seedDemo } from '../infrastructure/seed/demo-seed.ts'
import { seedIdentity } from '../infrastructure/seed/identity-seed.ts'
import { buildApp } from './app.ts'

const config = loadConfig()
const now = () => new Date().toISOString()
const db = openDatabase(config.dbPath)
applyMigrations(db)

if (config.isDevelopment && config.seedPassword) {
  const created = seedIdentity(db, config.seedPassword, now())
  if (created > 0) console.log(`Semente de identidade: ${created} usuário(s) criado(s).`)
}
if (config.isDevelopment && seedDemo(db, now())) {
  console.log('Semente de demonstração (dados fictícios) criada.')
}

const app = await buildApp({ db, config, now }, { logger: true })

const runJob = () => {
  try {
    runHourlyPass(db, now())
  } catch (error) {
    app.log.error(error, 'Falha no processamento periódico')
  }
}
runJob()
setInterval(runJob, HOURLY_INTERVAL_MS).unref()

await app.listen({ port: config.port, host: '127.0.0.1' })
