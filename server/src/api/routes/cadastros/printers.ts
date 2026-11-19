import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import type { PrinterOperationalStatus } from '../../../domain/enums.ts'
import {
  createPrinter,
  getPrinter,
  listPrinters,
  updatePrinter,
  deletePrinter,
  addPrinterMaterial,
} from '../../../infrastructure/repositories/catalog-repo.ts'
import { validatePrinter } from '../../../domain/rules/master-data-rules.ts'
import { reais, statusForCode } from '../../format.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/printers. US1 (T029) expõe a leitura; T035 (US2) acrescenta a escrita.

export const HOUR_RATE_STATEMENT = 'A taxa de hora-máquina não inclui filamento nem energia.'

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerPrinterRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/printers', { preHandler: app.requireRoles('Production', 'Operator', 'Admin') }, async () =>
    listPrinters(deps.db).map((printer) => ({
      id: printer.id,
      name: printer.name,
      model: printer.model,
      isActive: printer.is_active === 1,
      operationalStatus: printer.operational_status,
      costPerHour: reais(printer.cost_cents_per_hour),
      maintenanceLimitHours: printer.maintenance_limit_hours,
      compatibleMaterials: printer.compatibleMaterials,
      hourRateExcludesFilamentAndEnergy: true,
      hourRateStatement: HOUR_RATE_STATEMENT,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/printers/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Production', 'Operator', 'Admin') },
    async (request, reply) => {
      const printer = getPrinter(deps.db, request.params.id)
      if (!printer) return sendProblem(reply, 404, 'PRINTER_NOT_FOUND', 'Impressora não encontrada.')
      return {
        id: printer.id,
        name: printer.name,
        model: printer.model,
        isActive: printer.is_active === 1,
        operationalStatus: printer.operational_status,
        costPerHour: reais(printer.cost_cents_per_hour),
        maintenanceLimitHours: printer.maintenance_limit_hours,
        compatibleMaterials: printer.compatibleMaterials,
        hourRateExcludesFilamentAndEnergy: true,
        hourRateStatement: HOUR_RATE_STATEMENT,
      }
    },
  )

  app.post<{ Body: { name: string; model?: string; costPerHour: number; energyPerHour?: number; preparationMinutes?: number; compatibleMaterialIds?: number[] } }>(
    '/api/printers',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'costPerHour'],
          properties: {
            name: { type: 'string', minLength: 1 },
            model: { type: ['string', 'null'] },
            costPerHour: { type: 'number' },
            energyPerHour: { anyOf: [{ type: 'number', minimum: 0 }, { type: 'null' }] },
            preparationMinutes: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
            compatibleMaterialIds: { type: 'array', items: { type: 'integer', minimum: 1 } },
          },
        },
      },
      preHandler: app.requireRoles('Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome da impressora é obrigatório.')
      }
      const costCentsResult = request.body.costPerHour >= 0 ? Math.round(request.body.costPerHour * 100) : -1
      if (costCentsResult < 0) {
        return sendProblem(reply, 400, 'INVALID_COST_PER_HOUR', 'Custo por hora ≥ 0.')
      }
      const energyWh = request.body.energyPerHour !== null && request.body.energyPerHour !== undefined
        ? (request.body.energyPerHour >= 0 ? Math.round(request.body.energyPerHour * 1000) : null)
        : null
      const preparationSeconds = request.body.preparationMinutes !== null && request.body.preparationMinutes !== undefined
        ? Math.round(request.body.preparationMinutes * 60)
        : 0
      const validation = validatePrinter({
        name,
        costCentsPerHour: costCentsResult,
        energyWhPerHour: energyWh,
        maintenanceLimitHours: 0, // não se aplica na criação
        accumulatedSeconds: 0,
        preparationSeconds,
        isActive: true,
        operationalStatus: 'Available' as PrinterOperationalStatus,
        compatibleMaterialIds: request.body.compatibleMaterialIds ?? [],
      })
      if (!validation.ok) {
        return sendProblem(reply, 409, validation.code, validation.message)
      }
      const id = createPrinter(
        deps.db,
        name,
        request.body.model ?? null,
        costCentsResult,
        energyWh,
        99999, // placeholder: maintenance_limit_hours é obrigatório > 0; usuário define depois
        preparationSeconds,
        request.body.compatibleMaterialIds ?? [],
      )
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name?: string; model?: string; costPerHour?: number; energyPerHour?: number; maintenanceLimitHours?: number; accumulatedSeconds?: number; preparationSeconds?: number; isActive?: boolean; operationalStatus?: PrinterOperationalStatus; compatibleMaterialIds?: number[] } }>(
    '/api/printers/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            model: { type: ['string', 'null'] },
            costPerHour: { type: 'number' },
            energyPerHour: { anyOf: [{ type: 'number', minimum: 0 }, { type: 'null' }] },
            maintenanceLimitHours: { type: 'integer', minimum: 1 },
            accumulatedSeconds: { type: 'integer', minimum: 0 },
            preparationSeconds: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' },
            operationalStatus: { type: 'string' },
            compatibleMaterialIds: { type: 'array', items: { type: 'integer', minimum: 1 } },
          },
        },
      },
      preHandler: app.requireRoles('Admin'),
    },
    async (request, reply) => {
      const name = request.body.name?.trim() ?? ''
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome da impressora é obrigatório.')
      }
      const existing = getPrinter(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRINTER_NOT_FOUND', 'Impressora não encontrada.')
      const costCentsPerHour = request.body.costPerHour !== undefined ? Math.round(request.body.costPerHour * 100) : existing.cost_cents_per_hour
      const energyWhPerHour = request.body.energyPerHour !== undefined
        ? (request.body.energyPerHour !== null && request.body.energyPerHour >= 0 ? Math.round(request.body.energyPerHour * 1000) : null)
        : existing.energy_wh_per_hour
      const maintenanceLimitHours = request.body.maintenanceLimitHours ?? existing.maintenance_limit_hours
      const accumulatedSeconds = request.body.accumulatedSeconds ?? existing.accumulated_seconds
      const preparationSeconds = request.body.preparationSeconds ?? existing.preparation_seconds
      const isActive = request.body.isActive ?? existing.is_active === 1
      const operationalStatus = (request.body.operationalStatus as PrinterOperationalStatus | undefined) ?? existing.operational_status
      const compatibleMaterialIds = request.body.compatibleMaterialIds ?? existing.compatibleMaterials.map((m) => m.id)
      const validation = validatePrinter({
        name,
        costCentsPerHour,
        energyWhPerHour,
        maintenanceLimitHours,
        accumulatedSeconds,
        preparationSeconds,
        isActive,
        operationalStatus,
        compatibleMaterialIds,
      })
      if (!validation.ok) {
        return sendProblem(reply, 409, validation.code, validation.message)
      }
      updatePrinter(
        deps.db,
        request.params.id,
        name,
        request.body.model ?? null,
        costCentsPerHour,
        energyWhPerHour,
        accumulatedSeconds,
        preparationSeconds,
        isActive,
        operationalStatus,
        compatibleMaterialIds,
      )
      return { ok: true, hourRateExcludesFilamentAndEnergy: true, hourRateStatement: HOUR_RATE_STATEMENT }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/printers/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Admin') },
    async (request, reply) => {
      const existing = getPrinter(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRINTER_NOT_FOUND', 'Impressora não encontrada.')
      deletePrinter(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )

  app.post<{ Params: { id: number }; Body: { materialId: number } }>(
    '/api/printers/:id/materials',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['materialId'],
          properties: { materialId: { type: 'integer', minimum: 1 } },
        },
      },
      preHandler: app.requireRoles('Admin'),
    },
    async (request, reply) => {
      const existing = getPrinter(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRINTER_NOT_FOUND', 'Impressora não encontrada.')
      addPrinterMaterial(deps.db, request.params.id, request.body.materialId)
      return reply.code(201).send({ ok: true })
    },
  )
}
