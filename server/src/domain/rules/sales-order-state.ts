import type { CommercialOrderStatus } from '../enums.ts'
import { fail, ok, type Result } from '../result.ts'

// FR-009; contracts/comercial.md. T043 (US3) acrescenta Delivered a partir de ReadyToShip.

const ALLOWED: Partial<Record<CommercialOrderStatus, readonly CommercialOrderStatus[]>> = {
  QuotePending: ['Approved', 'Cancelled'],
}

export function transitionSalesOrder(
  from: CommercialOrderStatus,
  to: CommercialOrderStatus,
): Result<CommercialOrderStatus> {
  if (from === 'Cancelled') {
    return fail('ORDER_CANCELLED', 'Pedido cancelado não muda mais de estado.')
  }
  if (!(ALLOWED[from] ?? []).includes(to)) {
    return fail('INVALID_TRANSITION', `Pedido em ${from} não pode ir para ${to}.`)
  }
  return ok(to)
}

/** "Pedido em confirmação pendente não gera lote de produção, fatura nem pagamento." */
export function canReleaseLots(status: CommercialOrderStatus): Result<true> {
  return status === 'Approved' || status === 'InProduction'
    ? ok(true)
    : fail('ORDER_NOT_RELEASABLE', 'Só pedido confirmado libera lotes de produção.')
}
