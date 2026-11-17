import type { CommercialOrderStatus } from '../../domain/enums.ts'
import { fail, type Result } from '../../domain/result.ts'
import { transitionSalesOrder } from '../../domain/rules/sales-order-state.ts'
import type { Db } from '../../infrastructure/db/database.ts'
import { getOrder, updateOrderStatus } from '../../infrastructure/repositories/sales-repo.ts'
import { abort, transact } from '../transaction.ts'

// T078: PATCH /api/sales-orders/{id}/status, decidido por transitionSalesOrder.

export function changeSalesOrderStatus(
  db: Db,
  command: { salesOrderId: number; to: CommercialOrderStatus },
): Result<{ id: number; commercialStatus: CommercialOrderStatus }> {
  return transact(db, () => {
    const order = getOrder(db, command.salesOrderId)
    if (!order) abort(fail('ORDER_NOT_FOUND', 'Pedido não encontrado.'))
    const next = transitionSalesOrder(order.commercial_status, command.to)
    if (!next.ok) abort(next)
    updateOrderStatus(db, order.id, next.value)
    return { id: order.id, commercialStatus: next.value }
  })
}
