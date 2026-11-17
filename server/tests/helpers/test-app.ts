import type { FastifyInstance } from 'fastify'
import type { DatabaseSync } from 'node:sqlite'
import { buildApp } from '../../src/api/app.ts'
import type { AppConfig } from '../../src/infrastructure/config.ts'
import { openDatabase } from '../../src/infrastructure/db/database.ts'
import { applyMigrations } from '../../src/infrastructure/db/migrate.ts'
import { signToken } from '../../src/infrastructure/auth/jwt.ts'
import { seedIdentity } from '../../src/infrastructure/seed/identity-seed.ts'
import type { AppRole } from '../../src/domain/enums.ts'

export const TEST_SIGNING_KEY = 'chave-de-teste-com-mais-de-32-bytes-0123456789'
export const TEST_PASSWORD = 'Teste@123'

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    isDevelopment: false,
    port: 0,
    dbPath: ':memory:',
    filesDir: ':memory:',
    corsOrigins: [],
    jwtSigningKey: TEST_SIGNING_KEY,
    seedPassword: TEST_PASSWORD,
    ...overrides,
  }
}

export function migratedDb(): DatabaseSync {
  const db = openDatabase(':memory:')
  applyMigrations(db)
  return db
}

export async function buildTestApp(options: { seedUsers?: boolean } = {}): Promise<{
  app: FastifyInstance
  db: DatabaseSync
  clock: { now: string }
}> {
  const db = migratedDb()
  const clock = { now: '2026-11-17T12:00:00.000Z' }
  if (options.seedUsers) seedIdentity(db, TEST_PASSWORD, clock.now)
  const app = await buildApp({ db, config: testConfig(), now: () => clock.now })
  return { app, db, clock }
}

export function tokenFor(role: AppRole, userId = `user-${role}`): Promise<string> {
  return signToken({ sub: userId, role }, TEST_SIGNING_KEY)
}
