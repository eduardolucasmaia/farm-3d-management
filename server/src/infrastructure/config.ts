import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface AppConfig {
  nodeEnv: string
  isDevelopment: boolean
  port: number
  dbPath: string
  filesDir: string
  corsOrigins: string[]
  jwtSigningKey: string
  seedPassword: string | null
}

/** Raiz do repositório: caminhos relativos do .env partem daqui. */
export const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..')

function resolveFromRoot(path: string): string {
  return isAbsolute(path) || path === ':memory:' ? path : resolve(repoRoot, path)
}

/** Caminho do banco sem exigir as demais variáveis (usado pelos scripts de linha de comando). */
export function resolveDbPath(env: NodeJS.ProcessEnv = process.env): string {
  return resolveFromRoot(env.FARM3D_DB_PATH ?? 'data/farm3d.db')
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'production'
  const jwtSigningKey = env.JWT_SIGNING_KEY ?? ''
  if (Buffer.byteLength(jwtSigningKey, 'utf8') < 32) {
    throw new Error(
      'JWT_SIGNING_KEY ausente ou com menos de 32 bytes. Preencha no .env (veja .env.example).',
    )
  }
  const port = Number(env.PORT ?? '5088')
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT inválida: ${env.PORT}`)
  }
  return {
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    port,
    dbPath: resolveDbPath(env),
    filesDir: resolveFromRoot(env.FARM3D_FILES_DIR ?? 'data/files3d'),
    corsOrigins: (env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    jwtSigningKey,
    seedPassword: env.FARM3D_SEED_PASSWORD ? env.FARM3D_SEED_PASSWORD : null,
  }
}
