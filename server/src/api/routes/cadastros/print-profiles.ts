import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { validatePrintProfile } from '../../../domain/rules/master-data-rules.ts'
import {
  createPrintProfile,
  getPrintProfile,
  listPrintProfiles,
  updatePrintProfile,
  deletePrintProfile,
} from '../../../infrastructure/repositories/catalog-repo.ts'
import { grams, minutes } from '../../format.ts'
import { parseScaled } from '../../../domain/units.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/print-profiles. Produção e Admin escrevem.
// Unidades: minutos por prancha (2 casas), gramas por prancha (3 casas).

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerPrintProfileRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/print-profiles', { preHandler: app.requireRoles('Production', 'Admin') }, async () =>
    listPrintProfiles(deps.db).map((p) => ({
      id: p.id,
      name: p.name,
      materialId: p.material_id,
      piecesPerPlate: p.pieces_per_plate,
      minutesPerPlate: minutes(p.seconds_per_plate),
      gramsPerPlate: grams(p.mg_per_plate),
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/print-profiles/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Production', 'Admin') },
    async (request, reply) => {
      const profile = getPrintProfile(deps.db, request.params.id)
      if (!profile) return sendProblem(reply, 404, 'PRINT_PROFILE_NOT_FOUND', 'Perfil de produção não encontrado.')
      return {
        id: profile.id,
        name: profile.name,
        materialId: profile.material_id,
        piecesPerPlate: profile.pieces_per_plate,
        minutesPerPlate: minutes(profile.seconds_per_plate),
        gramsPerPlate: grams(profile.mg_per_plate),
      }
    },
  )

  app.post<{ Body: { name: string; piecesPerPlate: number; minutesPerPlate: number; gramsPerPlate: number; materialId?: number | null } }>(
    '/api/print-profiles',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'piecesPerPlate', 'minutesPerPlate', 'gramsPerPlate'],
          properties: {
            name: { type: 'string', minLength: 1 },
            piecesPerPlate: { type: 'integer', minimum: 1 },
            minutesPerPlate: { type: 'number' },
            gramsPerPlate: { type: 'number' },
            materialId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Production', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do perfil de produção é obrigatório.')
      }
      const secondsPerPlateResult = parseScaled(request.body.minutesPerPlate, 2)
      if (!secondsPerPlateResult.ok || secondsPerPlateResult.value <= 0) {
        return sendProblem(reply, 400, 'INVALID_MINUTES_PER_PLATE', 'Minutos por prancha > 0.')
      }
      const mgPerPlateResult = parseScaled(request.body.gramsPerPlate, 3)
      if (!mgPerPlateResult.ok || mgPerPlateResult.value <= 0) {
        return sendProblem(reply, 400, 'INVALID_GRAMS_PER_PLATE', 'Gramas por prancha > 0.')
      }
      const validation = validatePrintProfile({
        name,
        piecesPerPlate: request.body.piecesPerPlate,
        secondsPerPlate: secondsPerPlateResult.value,
        mgPerPlate: mgPerPlateResult.value,
      })
      if (!validation.ok) {
        return sendProblem(reply, 409, validation.code, validation.message)
      }
      const id = createPrintProfile(
        deps.db,
        name,
        request.body.materialId ?? null,
        request.body.piecesPerPlate,
        secondsPerPlateResult.value,
        mgPerPlateResult.value,
      )
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; piecesPerPlate: number; minutesPerPlate: number; gramsPerPlate: number; materialId?: number | null } }>(
    '/api/print-profiles/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name', 'piecesPerPlate', 'minutesPerPlate', 'gramsPerPlate'],
          properties: {
            name: { type: 'string', minLength: 1 },
            piecesPerPlate: { type: 'integer', minimum: 1 },
            minutesPerPlate: { type: 'number' },
            gramsPerPlate: { type: 'number' },
            materialId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Production', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do perfil de produção é obrigatório.')
      }
      const secondsPerPlateResult = parseScaled(request.body.minutesPerPlate, 2)
      if (!secondsPerPlateResult.ok || secondsPerPlateResult.value <= 0) {
        return sendProblem(reply, 400, 'INVALID_MINUTES_PER_PLATE', 'Minutos por prancha > 0.')
      }
      const mgPerPlateResult = parseScaled(request.body.gramsPerPlate, 3)
      if (!mgPerPlateResult.ok || mgPerPlateResult.value <= 0) {
        return sendProblem(reply, 400, 'INVALID_GRAMS_PER_PLATE', 'Gramas por prancha > 0.')
      }
      const validation = validatePrintProfile({
        name,
        piecesPerPlate: request.body.piecesPerPlate,
        secondsPerPlate: secondsPerPlateResult.value,
        mgPerPlate: mgPerPlateResult.value,
      })
      if (!validation.ok) {
        return sendProblem(reply, 409, validation.code, validation.message)
      }
      const existing = getPrintProfile(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRINT_PROFILE_NOT_FOUND', 'Perfil de produção não encontrado.')
      updatePrintProfile(
        deps.db,
        request.params.id,
        name,
        request.body.materialId ?? null,
        request.body.piecesPerPlate,
        secondsPerPlateResult.value,
        mgPerPlateResult.value,
      )
      return { ok: true }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/print-profiles/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Production', 'Admin') },
    async (request, reply) => {
      const existing = getPrintProfile(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRINT_PROFILE_NOT_FOUND', 'Perfil de produção não encontrado.')
      deletePrintProfile(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )
}
