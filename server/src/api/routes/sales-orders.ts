import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import { CommercialOrderStatus } from '../../domain/enums.ts'
import { changeSalesOrderStatus } from '../../application/use-cases/change-sales-order-status.ts'
import { getOrder, getOrderLines, listOrders } from '../../infrastructure/repositories/sales-repo.ts'
import { listOrderLots, lotReservations } from '../../infrastructure/repositories/production-repo.ts'
import { grams, minutes, reais, statusForCode } from '../format.ts'
import { sendProblem } from '../problem.ts'

// contracts/comercial.md, "Pedidos". T043 (US3) acrescenta criação, geração por orçamento e Delivered.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerSalesOrderRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/sales-orders', { preHandler: app.requireRoles('Sales', 'Production', 'Admin') }, async () =>
    listOrders(deps.db).map((order) => ({
      id: order.id,
      number: order.number,
      customerName: order.customer_name,
      commercialStatus: order.commercial_status,
      promisedDate: order.promised_date,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/sales-orders/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Sales', 'Production', 'Admin') },
    async (request, reply) => {
      const order = getOrder(deps.db, request.params.id)
      if (!order) return sendProblem(reply, 404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
      return {
        id: order.id,
        number: order.number,
        customerName: order.customer_name,
        commercialStatus: order.commercial_status,
        promisedDate: order.promised_date,
        lines: getOrderLines(deps.db, order.id).map((line) => ({
          id: line.id,
          productName: line.product_name,
          quantity: line.quantity,
          materialName: line.material_name,
          colorName: line.color_name,
          size: line.size,
          unitPrice: reais(line.unit_price_cents),
        })),
        lots: listOrderLots(deps.db, order.id).map((lot) => ({
          id: lot.id,
          lotIndex: lot.lot_index,
          orderLineId: lot.order_line_id,
          qtyPlanned: lot.qty_planned,
          plannedGrams: grams(lot.planned_mg),
          plannedMinutes: minutes(lot.planned_seconds),
          status: lot.status,
          printerName: lot.printer_name,
          reservations: lotReservations(deps.db, lot.id).map((r) => ({
            materialLotCode: r.material_lot_code,
            grams: grams(r.reserved_mg),
          })),
        })),
      }
    },
  )

  app.patch<{ Params: { id: number }; Body: { status: CommercialOrderStatus } }>(
    '/api/sales-orders/:id/status',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: Object.values(CommercialOrderStatus) } },
        },
      },
      preHandler: app.requireRoles('Sales', 'Admin'),
    },
    async (request, reply) => {
      const result = changeSalesOrderStatus(deps.db, { salesOrderId: request.params.id, to: request.body.status })
      if (!result.ok) return sendProblem(reply, statusForCode(result.code), result.code, result.message)
      return result.value
    },
  )
}
