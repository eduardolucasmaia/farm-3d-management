import { describe, expect, it } from 'vitest'
import { canReleaseLots, transitionSalesOrder } from '../../src/domain/rules/sales-order-state.ts'

describe('transitionSalesOrder (FR-009)', () => {
  it('confirmação pendente vai a confirmado ou a cancelado', () => {
    expect(transitionSalesOrder('QuotePending', 'Approved')).toEqual({ ok: true, value: 'Approved' })
    expect(transitionSalesOrder('QuotePending', 'Cancelled')).toEqual({ ok: true, value: 'Cancelled' })
  })

  it('confirmação pendente não vai a outros estados', () => {
    expect(transitionSalesOrder('QuotePending', 'Delivered')).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' })
  })

  it('pedido cancelado não muda mais de estado', () => {
    for (const to of ['QuotePending', 'Approved', 'Delivered'] as const) {
      expect(transitionSalesOrder('Cancelled', to)).toMatchObject({ ok: false, code: 'ORDER_CANCELLED' })
    }
  })

  it('não existe volta a confirmação pendente', () => {
    expect(transitionSalesOrder('Approved', 'QuotePending')).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' })
  })
})

describe('canReleaseLots (FR-009)', () => {
  it('só pedido confirmado ou já em produção admite liberar lotes', () => {
    expect(canReleaseLots('Approved').ok).toBe(true)
    expect(canReleaseLots('InProduction').ok).toBe(true)
    expect(canReleaseLots('QuotePending')).toMatchObject({ ok: false, code: 'ORDER_NOT_RELEASABLE' })
    expect(canReleaseLots('Cancelled')).toMatchObject({ ok: false, code: 'ORDER_NOT_RELEASABLE' })
  })
})
