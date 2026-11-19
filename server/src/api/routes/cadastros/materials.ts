import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { parseScaled } from '../../../domain/units.ts'
import { createMaterial, getMaterial, listMaterials, updateMaterial, deleteMaterial } from '../../../infrastructure/repositories/cadastros-repo.ts'
import { reais, grams, statusForCode } from '../../format.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/materials. Compras e Admin escrevem.
// Unidades: referência em reais/kg (2 casas), ponto de reposição em gramas (3 casas),
// diâmetro em mm (3 casas).

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerMaterialRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/materials', { preHandler: app.requireRoles('Admin', 'Production', 'Sales', 'Purchasing', 'Operator') }, async () =>
    listMaterials(deps.db).map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      brand: m.brand,
      diameterMm: m.diameter_um ? grams(m.diameter_um) / 1000 : null,
      colorId: m.color_id,
      referenceCost: reais(m.reference_cost_cents_per_kg),
      reorderPointGrams: m.reorder_point_mg !== null ? grams(m.reorder_point_mg) : null,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/materials/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Admin', 'Production', 'Sales', 'Purchasing', 'Operator') },
    async (request, reply) => {
      const material = getMaterial(deps.db, request.params.id)
      if (!material) return sendProblem(reply, 404, 'MATERIAL_NOT_FOUND', 'Material não encontrado.')
      return {
        id: material.id,
        name: material.name,
        kind: material.kind,
        brand: material.brand,
        diameterMm: material.diameter_um ? grams(material.diameter_um) / 1000 : null,
        colorId: material.color_id,
        referenceCost: reais(material.reference_cost_cents_per_kg),
        reorderPointGrams: material.reorder_point_mg !== null ? grams(material.reorder_point_mg) : null,
      }
    },
  )

  app.post<{ Body: { name: string; kind: string; referenceCost: number; diameterMm?: number | null; colorId?: number | null; reorderPointGrams?: number | null } }>(
    '/api/materials',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'kind', 'referenceCost'],
          properties: {
            name: { type: 'string', minLength: 1 },
            kind: { type: 'string' },
            referenceCost: { type: 'number' },
            diameterMm: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            colorId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
            reorderPointGrams: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Purchasing', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do material é obrigatório.')
      }
      const kind = request.body.kind
      const validKinds = ['Filament', 'Resin', 'SparePart', 'Packaging', 'Other']
      if (!validKinds.includes(kind)) {
        return sendProblem(reply, 400, 'INVALID_KIND', `Kind inválido. Use: ${validKinds.join(', ')}.`)
      }
      const referenceCostResult = parseScaled(request.body.referenceCost, 2)
      if (!referenceCostResult.ok || referenceCostResult.value < 0) {
        return sendProblem(reply, 400, 'INVALID_REFERENCE_COST', 'Custo de referência ≥ 0.')
      }
      let diameterUm: number | null = null
      if (request.body.diameterMm !== null && request.body.diameterMm !== undefined) {
        const diaResult = parseScaled(request.body.diameterMm, 3)
        if (!diaResult.ok || diaResult.value <= 0) {
          return sendProblem(reply, 400, 'INVALID_DIAMETER', 'Diâmetro > 0 mm.')
        }
        diameterUm = diaResult.value
      }
      const reorderResult = request.body.reorderPointGrams !== null && request.body.reorderPointGrams !== undefined
        ? parseScaled(request.body.reorderPointGrams, 3)
        : null
      if (reorderResult && (reorderResult.ok ? reorderResult.value < 0 : false)) {
        return sendProblem(reply, 400, 'INVALID_REORDER_POINT', 'Ponto de reposição ≥ 0.')
      }
      const id = createMaterial(
        deps.db,
        name,
        kind,
        null,
        diameterUm,
        request.body.colorId ?? null,
        referenceCostResult.value,
        reorderResult?.ok ? reorderResult.value : null,
      )
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; kind: string; referenceCost: number; diameterMm?: number | null; colorId?: number | null; reorderPointGrams?: number | null } }>(
    '/api/materials/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name', 'kind', 'referenceCost'],
          properties: {
            name: { type: 'string', minLength: 1 },
            kind: { type: 'string' },
            referenceCost: { type: 'number' },
            diameterMm: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            colorId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
            reorderPointGrams: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          },
        },
      },
      preHandler: app.requireRoles('Purchasing', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do material é obrigatório.')
      }
      const existing = getMaterial(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'MATERIAL_NOT_FOUND', 'Material não encontrado.')
      const kind = request.body.kind
      const validKinds = ['Filament', 'Resin', 'SparePart', 'Packaging', 'Other']
      if (!validKinds.includes(kind)) {
        return sendProblem(reply, 400, 'INVALID_KIND', `Kind inválido. Use: ${validKinds.join(', ')}.`)
      }
      const referenceCostResult = parseScaled(request.body.referenceCost, 2)
      if (!referenceCostResult.ok || referenceCostResult.value < 0) {
        return sendProblem(reply, 400, 'INVALID_REFERENCE_COST', 'Custo de referência ≥ 0.')
      }
      let diameterUm: number | null = null
      if (request.body.diameterMm !== null && request.body.diameterMm !== undefined) {
        const diaResult = parseScaled(request.body.diameterMm, 3)
        if (!diaResult.ok || diaResult.value <= 0) {
          return sendProblem(reply, 400, 'INVALID_DIAMETER', 'Diâmetro > 0 mm.')
        }
        diameterUm = diaResult.value
      }
      const reorderResult = request.body.reorderPointGrams !== null && request.body.reorderPointGrams !== undefined
        ? parseScaled(request.body.reorderPointGrams, 3)
        : null
      if (reorderResult && (reorderResult.ok ? reorderResult.value < 0 : false)) {
        return sendProblem(reply, 400, 'INVALID_REORDER_POINT', 'Ponto de reposição ≥ 0.')
      }
      updateMaterial(
        deps.db,
        request.params.id,
        name,
        kind,
        null,
        diameterUm,
        request.body.colorId ?? null,
        referenceCostResult.value,
        reorderResult?.ok ? reorderResult.value : null,
      )
      return { ok: true }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/materials/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Purchasing', 'Admin') },
    async (request, reply) => {
      const existing = getMaterial(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'MATERIAL_NOT_FOUND', 'Material não encontrado.')
      deleteMaterial(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )
}
