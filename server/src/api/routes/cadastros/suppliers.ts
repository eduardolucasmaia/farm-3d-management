import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import {
  createSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
  deleteSupplier,
} from '../../../infrastructure/repositories/cadastros-repo.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/suppliers. Compras e Admin.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerSupplierRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/suppliers', { preHandler: app.requireRoles('Purchasing', 'Admin') }, async () =>
    listSuppliers(deps.db).map((s) => ({
      id: s.id,
      name: s.name,
      paymentTerms: s.payment_terms,
      averageLeadTimeDays: s.average_lead_time_days,
      contact: s.contact,
      createdAt: s.created_at,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/suppliers/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Purchasing', 'Admin') },
    async (request, reply) => {
      const supplier = getSupplier(deps.db, request.params.id)
      if (!supplier) return sendProblem(reply, 404, 'SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado.')
      return {
        id: supplier.id,
        name: supplier.name,
        paymentTerms: supplier.payment_terms,
        averageLeadTimeDays: supplier.average_lead_time_days,
        contact: supplier.contact,
        createdAt: supplier.created_at,
      }
    },
  )

  app.post<{ Body: { name: string; paymentTerms?: string; averageLeadTimeDays?: number; contact?: string } }>(
    '/api/suppliers',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            paymentTerms: { type: ['string', 'null'] },
            averageLeadTimeDays: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
            contact: { type: ['string', 'null'] },
          },
        },
      },
      preHandler: app.requireRoles('Purchasing', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do fornecedor é obrigatório.')
      }
      const id = createSupplier(
        deps.db,
        name,
        request.body.paymentTerms ?? null,
        request.body.averageLeadTimeDays ?? null,
        request.body.contact ?? null,
      )
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; paymentTerms?: string; averageLeadTimeDays?: number; contact?: string } }>(
    '/api/suppliers/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            paymentTerms: { type: ['string', 'null'] },
            averageLeadTimeDays: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
            contact: { type: ['string', 'null'] },
          },
        },
      },
      preHandler: app.requireRoles('Purchasing', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do fornecedor é obrigatório.')
      }
      const existing = getSupplier(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado.')
      updateSupplier(
        deps.db,
        request.params.id,
        name,
        request.body.paymentTerms ?? null,
        request.body.averageLeadTimeDays ?? null,
        request.body.contact ?? null,
      )
      return { ok: true }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/suppliers/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Purchasing', 'Admin') },
    async (request, reply) => {
      const existing = getSupplier(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado.')
      deleteSupplier(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )
}
