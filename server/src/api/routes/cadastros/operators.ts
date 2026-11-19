import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { createOperator, getOperator, listOperators, updateOperator } from '../../../infrastructure/repositories/masters-repo.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/operators. Qualquer autenticado lê; Admin escreve.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerOperatorRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/operators', { preHandler: app.requireRoles('Admin', 'Production', 'Sales', 'Purchasing', 'Operator') }, async () =>
    listOperators(deps.db).map((o) => ({
      id: o.id,
      name: o.name,
      userId: o.userId,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/operators/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Admin', 'Production', 'Sales', 'Purchasing', 'Operator') },
    async (request, reply) => {
      const operator = getOperator(deps.db, request.params.id)
      if (!operator) return sendProblem(reply, 404, 'OPERATOR_NOT_FOUND', 'Operador não encontrado.')
      return { id: operator.id, name: operator.name, userId: operator.userId }
    },
  )

  app.post<{ Body: { name: string; userId?: number | null } }>(
    '/api/operators',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            userId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do operador é obrigatório.')
      }
      const id = createOperator(deps.db, name, request.body.userId ?? null)
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; userId?: number | null } }>(
    '/api/operators/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            userId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do operador é obrigatório.')
      }
      const existing = getOperator(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'OPERATOR_NOT_FOUND', 'Operador não encontrado.')
      updateOperator(deps.db, request.params.id, name, request.body.userId ?? null)
      return { ok: true }
    },
  )
}
