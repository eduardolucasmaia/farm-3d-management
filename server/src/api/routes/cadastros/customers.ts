import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  deleteCustomer,
} from '../../../infrastructure/repositories/cadastros-repo.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/customers. Vendas e Admin.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerCustomerRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/customers', { preHandler: app.requireRoles('Sales', 'Production', 'Admin') }, async () =>
    listCustomers(deps.db).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      createdAt: c.created_at,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/customers/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Sales', 'Production', 'Admin') },
    async (request, reply) => {
      const customer = getCustomer(deps.db, request.params.id)
      if (!customer) return sendProblem(reply, 404, 'CUSTOMER_NOT_FOUND', 'Cliente não encontrado.')
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        createdAt: customer.created_at,
      }
    },
  )

  app.post<{ Body: { name: string; email?: string; phone?: string; address?: string } }>(
    '/api/customers',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: ['string', 'null'] },
            phone: { type: ['string', 'null'] },
            address: { type: ['string', 'null'] },
          },
        },
      },
      preHandler: app.requireRoles('Sales', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do cliente é obrigatório.')
      }
      const id = createCustomer(
        deps.db,
        name,
        request.body.email ?? null,
        request.body.phone ?? null,
        request.body.address ?? null,
      )
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; email?: string; phone?: string; address?: string } }>(
    '/api/customers/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: ['string', 'null'] },
            phone: { type: ['string', 'null'] },
            address: { type: ['string', 'null'] },
          },
        },
      },
      preHandler: app.requireRoles('Sales', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do cliente é obrigatório.')
      }
      const existing = getCustomer(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'CUSTOMER_NOT_FOUND', 'Cliente não encontrado.')
      updateCustomer(
        deps.db,
        request.params.id,
        name,
        request.body.email ?? null,
        request.body.phone ?? null,
        request.body.address ?? null,
      )
      return { ok: true }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/customers/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Sales', 'Admin') },
    async (request, reply) => {
      const existing = getCustomer(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'CUSTOMER_NOT_FOUND', 'Cliente não encontrado.')
      deleteCustomer(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )
}
