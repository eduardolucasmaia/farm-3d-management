import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { createColor, getColor, listColors, updateColor, deleteColor } from '../../../infrastructure/repositories/cadastros-repo.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/colors. Qualquer autenticado lê; Produção e Admin escrevem.
// Regra: hex ou vazio ou #RRGGBB.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

function validateHex(hex: string | null): true | string {
  if (hex === null) return true
  if (hex.length === 0) return true
  const pattern = /^#[0-9A-Fa-f]{6}$/
  if (!pattern.test(hex)) return 'Hex deve ser vazio ou #RRGGBB.'
  return true
}

export function registerColorRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/colors', { preHandler: app.requireRoles('Admin', 'Production', 'Sales', 'Purchasing', 'Operator') }, async () =>
    listColors(deps.db).map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/colors/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Admin', 'Production', 'Sales', 'Purchasing', 'Operator') },
    async (request, reply) => {
      const color = getColor(deps.db, request.params.id)
      if (!color) return sendProblem(reply, 404, 'COLOR_NOT_FOUND', 'Cor não encontrada.')
      return { id: color.id, name: color.name, hex: color.hex }
    },
  )

  app.post<{ Body: { name: string; hex?: string | null } }>(
    '/api/colors',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            hex: { anyOf: [{ type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }, { type: 'string', minLength: 0 }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Production', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome da cor é obrigatório.')
      }
      const hexResult = validateHex(request.body.hex ?? null)
      if (hexResult !== true) {
        return sendProblem(reply, 400, 'INVALID_HEX', hexResult)
      }
      const id = createColor(deps.db, name, request.body.hex ?? null)
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; hex?: string | null } }>(
    '/api/colors/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            hex: { anyOf: [{ type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }, { type: 'string', minLength: 0 }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Production', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome da cor é obrigatório.')
      }
      const hexResult = validateHex(request.body.hex ?? null)
      if (hexResult !== true) {
        return sendProblem(reply, 400, 'INVALID_HEX', hexResult)
      }
      const existing = getColor(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'COLOR_NOT_FOUND', 'Cor não encontrada.')
      updateColor(deps.db, request.params.id, name, request.body.hex ?? null)
      return { ok: true }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/colors/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Production', 'Admin') },
    async (request, reply) => {
      const existing = getColor(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'COLOR_NOT_FOUND', 'Cor não encontrada.')
      deleteColor(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )
}
