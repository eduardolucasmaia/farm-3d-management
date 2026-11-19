import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { createFile3D, getFile3D, listFiles3D } from '../../../infrastructure/repositories/masters-repo.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/files3d. Produção e Admin escrevem.
// Arquivo binário em POST /api/files3d/:id/versions (T037).

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerFiles3DRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/files3d', { preHandler: app.requireRoles('Production', 'Admin') }, async () =>
    listFiles3D(deps.db).map((f) => ({
      id: f.id,
      name: f.name,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/files3d/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Production', 'Admin') },
    async (request, reply) => {
      const file = getFile3D(deps.db, request.params.id)
      if (!file) return sendProblem(reply, 404, 'FILE_3D_NOT_FOUND', 'Arquivo 3D não encontrado.')
      return {
        id: file.id,
        name: file.name,
      }
    },
  )

  app.post<{ Body: { name: string } }>(
    '/api/files3d',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1 } },
        },
      },
      preHandler: app.requireRoles('Production', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do arquivo 3D é obrigatório.')
      }
      const id = createFile3D(deps.db, name)
      return reply.code(201).send({ id })
    },
  )
}
