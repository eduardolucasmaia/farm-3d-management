import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import { evaluateLogin } from '../../domain/rules/login-lockout.ts'
import { DUMMY_HASH, verifyPassword } from '../../infrastructure/auth/password.ts'
import { signToken } from '../../infrastructure/auth/jwt.ts'
import { findUserByEmail, updateLoginState } from '../../infrastructure/repositories/users-repo.ts'
import { sendProblem } from '../problem.ts'

// contracts/auth.md, POST /api/auth/login.
const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.'

export function registerAuthRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.post<{ Body: { email: string; password: string } }>(
    '/api/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string', minLength: 1 }, password: { type: 'string', minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const user = findUserByEmail(deps.db, email)
      if (!user) {
        verifyPassword(password, DUMMY_HASH)
        return sendProblem(reply, 401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS)
      }
      const matches = verifyPassword(password, user.password_hash)
      const decision = evaluateLogin(
        { failedCount: user.failed_login_count, lockedUntil: user.locked_until },
        matches,
        deps.now(),
      )
      if (decision.failedCount !== user.failed_login_count || decision.lockedUntil !== user.locked_until) {
        updateLoginState(deps.db, user.id, decision.failedCount, decision.lockedUntil)
      }
      if (!decision.allowed) {
        return sendProblem(reply, 401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS)
      }
      const token = await signToken({ sub: user.id, role: user.role }, deps.config.jwtSigningKey)
      return { token, email: user.email, roles: [user.role] }
    },
  )
}
