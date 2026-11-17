import type { ProductionLotStatus } from '../../domain/enums.ts'
import { fail, type Result } from '../../domain/result.ts'
import { planRelease, type ReleaseLineInput } from '../../domain/rules/release-plan.ts'
import type { Db } from '../../infrastructure/db/database.ts'
import { countLots, insertLot, insertReservation, releasedLineIds } from '../../infrastructure/repositories/production-repo.ts'
import { getOrder, getOrderLines, updateOrderStatus } from '../../infrastructure/repositories/sales-repo.ts'
import { addReservedMg, insertMovement, listFreeLots, type FreeLotRow } from '../../infrastructure/repositories/stock-repo.ts'
import { abort, transact } from '../transaction.ts'

// T027: carrega, chama planRelease e grava o plano numa transação.
// Qualquer lote que não caiba desfaz tudo (princípio IV).

export interface ReleasedLot {
  id: number
  lotIndex: number
  orderLineId: number
  qtyPlanned: number
  plannedMg: number
  plannedSeconds: number
  status: ProductionLotStatus
}

export function releaseLots(
  db: Db,
  command: { salesOrderId: number; userId: string; now: string },
): Result<ReleasedLot[]> {
  return transact(db, () => {
    const order = getOrder(db, command.salesOrderId)
    if (!order) abort(fail('ORDER_NOT_FOUND', 'Pedido não encontrado.'))

    const released = releasedLineIds(db, order.id)
    const lineRows = getOrderLines(db, order.id)
    const lines: ReleaseLineInput[] = lineRows.map((line) => ({
      orderLineId: line.id,
      quantity: line.quantity,
      materialId: line.material_id,
      profile:
        line.pieces_per_plate === null || line.seconds_per_plate === null || line.mg_per_plate === null
          ? null
          : { piecesPerPlate: line.pieces_per_plate, secondsPerPlate: line.seconds_per_plate, mgPerPlate: line.mg_per_plate },
      alreadyReleased: released.has(line.id),
    }))

    const freeLotsByMaterial = new Map<number, FreeLotRow[]>()
    for (const line of lines) {
      if (line.materialId !== null && !freeLotsByMaterial.has(line.materialId)) {
        freeLotsByMaterial.set(line.materialId, listFreeLots(db, line.materialId))
      }
    }

    const plan = planRelease({
      orderStatus: order.commercial_status,
      lines,
      freeLotsByMaterial,
      firstLotIndex: countLots(db, order.id) + 1,
    })
    if (!plan.ok) abort(plan)

    const costByStockItem = new Map<number, number>()
    for (const lots of freeLotsByMaterial.values()) {
      for (const lot of lots) costByStockItem.set(lot.stockItemId, lot.costCentsPerKg)
    }
    const productByLine = new Map(lineRows.map((line) => [line.id, line.product_id]))

    const result: ReleasedLot[] = []
    for (const lot of plan.value) {
      const lotId = insertLot(db, {
        salesOrderId: order.id,
        orderLineId: lot.orderLineId,
        productId: productByLine.get(lot.orderLineId) as number,
        materialId: lot.materialId,
        lotIndex: lot.lotIndex,
        qtyPlanned: lot.pieces,
        status: 'Released',
        plannedMg: lot.plannedMg,
        plannedSeconds: lot.plannedSeconds,
        createdAt: command.now,
        releasedAt: command.now,
      })
      for (const allocation of lot.allocations) {
        insertReservation(db, lotId, allocation.stockItemId, allocation.mg)
        addReservedMg(db, allocation.stockItemId, allocation.mg)
        insertMovement(db, {
          kind: 'Reserve',
          materialId: lot.materialId,
          stockItemId: allocation.stockItemId,
          quantityMg: allocation.mg,
          unitCostCentsPerKg: costByStockItem.get(allocation.stockItemId) ?? 0,
          createdAt: command.now,
          userId: command.userId,
          productionLotId: lotId,
        })
      }
      result.push({
        id: lotId,
        lotIndex: lot.lotIndex,
        orderLineId: lot.orderLineId,
        qtyPlanned: lot.pieces,
        plannedMg: lot.plannedMg,
        plannedSeconds: lot.plannedSeconds,
        status: 'Released',
      })
    }

    // contracts/comercial.md: InProduction quando o primeiro lote sai de AwaitingPlanning.
    if (order.commercial_status === 'Approved') updateOrderStatus(db, order.id, 'InProduction')
    return result
  })
}
