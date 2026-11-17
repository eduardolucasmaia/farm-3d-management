import Fastify, { type FastifyInstance, type preHandlerAsyncHookHandler } from 'fastify'
import cors from '@fastify/cors'
import type { AppRole } from '../domain/enums.ts'
import type { AppConfig } from '../infrastructure/config.ts'
import type { Db } from '../infrastructure/db/database.ts'
import { verifyToken } from '../infrastructure/auth/jwt.ts'
import { sendProblem } from './problem.ts'
import { registerAuthRoutes } from './routes/auth.ts'
import { registerPrinterRoutes } from './routes/cadastros/printers.ts'
import { registerLotRoutes } from './routes/lots.ts'
import { registerSalesOrderRoutes } from './routes/sales-orders.ts'

export interface AppDeps {
  db: Db
  config: AppConfig
  /** Instante atual em ISO-8601 UTC. Testes passam um relógio fixo. */
  now: () => string
}

export interface SessionUser {
  id: string
  role: AppRole
}

declare module 'fastify' {
  interface FastifyInstance {
    requireRoles(...roles: AppRole[]): preHandlerAsyncHookHandler
  }
  interface FastifyRequest {
    user: SessionUser | null
  }
}

export async function buildApp(deps: AppDeps, options: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false })

  await app.register(cors, {
    origin: deps.config.isDevelopment ? true : deps.config.corsOrigins,
  })

  app.decorateRequest('user', null)

  // Recusa no servidor (princípio VII): 401 sem sessão válida, 403 com papel fora da lista.
  app.decorate('requireRoles', (...roles: AppRole[]): preHandlerAsyncHookHandler => {
    return async (request, reply) => {
      const header = request.headers.authorization ?? ''
      const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
      if (!token) {
        return sendProblem(reply, 401, 'UNAUTHENTICATED', 'Sessão ausente. Entre novamente.')
      }
      try {
        const claims = await verifyToken(token, deps.config.jwtSigningKey)
        request.user = { id: claims.sub, role: claims.role }
      } catch {
        return sendProblem(reply, 401, 'UNAUTHENTICATED', 'Sessão inválida ou vencida. Entre novamente.')
      }
      if (roles.length > 0 && !roles.includes(request.user.role)) {
        return sendProblem(reply, 403, 'FORBIDDEN', 'Seu papel não permite esta ação.')
      }
    }
  })

  app.setErrorHandler((error: { validation?: unknown; statusCode?: number; message: string }, request, reply) => {
    if (error.validation) {
      return sendProblem(reply, 400, 'VALIDATION_ERROR', error.message)
    }
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500
    if (status === 500) request.log.error(error)
    return sendProblem(reply, status, status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR', status === 500 ? 'Erro interno.' : error.message)
  })

  app.setNotFoundHandler((request, reply) =>
    sendProblem(reply, 404, 'NOT_FOUND', `Rota não encontrada: ${request.method} ${request.url}`),
  )

  // Registro de rotas: um por arquivo de contrato. Só acréscimo neste bloco.
  registerAuthRoutes(app, deps)
  registerSalesOrderRoutes(app, deps)
  registerLotRoutes(app, deps)
  registerPrinterRoutes(app, deps)

  return app
}
