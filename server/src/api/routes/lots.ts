import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import { ProductionLotStatus } from '../../domain/enums.ts'
import { releaseLots } from '../../application/use-cases/release-lots.ts'
import { enqueueLot } from '../../application/use-cases/enqueue-lot.ts'
import { listLotsByStatus } from '../../infrastructure/repositories/production-repo.ts'
import { grams, minutes, statusForCode } from '../format.ts'
import { sendProblem } from '../problem.ts'

// contracts/producao.md: liberar, enfileirar e listar lotes de produção.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerLotRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.post<{ Params: { id: number } }>(
    '/api/sales-orders/:id/lots/release',
    { schema: { params: idParams }, preHandler: app.requireRoles('Production', 'Admin') },
    async (request, reply) => {
      const result = releaseLots(deps.db, {
        salesOrderId: request.params.id,
        userId: request.user?.id ?? '',
        now: deps.now(),
      })
      if (!result.ok) {
        const extra =
          result.code === 'INSUFFICIENT_MATERIAL' && result.details
            ? {
                lotIndex: result.details.lotIndex,
                neededGrams: grams(Number(result.details.neededMg)),
                freeGrams: grams(Number(result.details.freeMg)),
              }
            : {}
        return sendProblem(reply, statusForCode(result.code), result.code, result.message, extra)
      }
      return reply.code(201).send({
        lots: result.value.map((lot) => ({
          id: lot.id,
          lotIndex: lot.lotIndex,
          orderLineId: lot.orderLineId,
          qtyPlanned: lot.qtyPlanned,
          plannedGrams: grams(lot.plannedMg),
          plannedMinutes: minutes(lot.plannedSeconds),
          releasedPiecesPerPlate: lot.releasedPiecesPerPlate,
          releasedMinutesPerPlate: minutes(lot.releasedSecondsPerPlate),
          releasedGramsPerPlate: grams(lot.releasedMgPerPlate),
          status: lot.status,
        })),
      })
    },
  )

  app.post<{ Params: { id: number }; Body: { printerId: number | null; priority?: number } }>(
    '/api/lots/:id/queue',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['printerId'],
          properties: {
            printerId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
            priority: { type: 'integer', default: 0 },
          },
        },
      },
      preHandler: app.requireRoles('Production', 'Admin'),
    },
    async (request, reply) => {
      const result = enqueueLot(deps.db, {
        lotId: request.params.id,
        printerId: request.body.printerId,
        priority: request.body.priority ?? 0,
        now: deps.now(),
      })
      if (!result.ok) return sendProblem(reply, statusForCode(result.code), result.code, result.message)
      const { created, ...body } = result.value
      return reply.code(created ? 201 : 200).send(body)
    },
  )

  app.get<{ Querystring: { status?: string } }>(
    '/api/lots',
    {
      schema: { querystring: { type: 'object', properties: { status: { type: 'string' } } } },
      preHandler: app.requireRoles('Production', 'Operator', 'Admin'),
    },
    async (request, reply) => {
      const requested = request.query.status
        ? request.query.status.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Released', 'Queued']
      const invalid = requested.filter((s) => !Object.hasOwn(ProductionLotStatus, s))
      if (invalid.length > 0) {
        return sendProblem(reply, 400, 'INVALID_STATUS', `Estado de lote desconhecido: ${invalid.join(', ')}.`)
      }
      return listLotsByStatus(deps.db, requested as ProductionLotStatus[]).map((lot) => ({
        id: lot.id,
        orderNumber: lot.order_number,
        productName: lot.product_name,
        materialName: lot.material_name,
        lotIndex: lot.lot_index,
        qtyPlanned: lot.qty_planned,
        plannedGrams: grams(lot.planned_mg),
        plannedMinutes: minutes(lot.planned_seconds),
        reservedGrams: grams(lot.reserved_mg),
        missingMaterialG: grams(Math.max(0, lot.planned_mg - lot.reserved_mg)),
        releasedPiecesPerPlate: lot.released_pieces_per_plate,
        releasedMinutesPerPlate: minutes(lot.released_seconds_per_plate),
        releasedGramsPerPlate: grams(lot.released_mg_per_plate),
        status: lot.status,
        printerId: lot.printer_id,
        printerName: lot.printer_name,
        priority: lot.priority,
        position: lot.position,
      }))
    },
  )
}
