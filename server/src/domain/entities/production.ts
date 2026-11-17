import type { ProductionLotStatus } from '../enums.ts'

// Tipos de produção (data-model.md, "Produção"). Só tipos.

export interface ProductionLot {
  id: number
  salesOrderId: number
  orderLineId: number
  productId: number
  materialId: number
  /** Posição do lote dentro do pedido, a partir de 1. */
  lotIndex: number
  qtyPlanned: number
  qtyCompleted: number
  status: ProductionLotStatus
  plannedMg: number
  plannedSeconds: number
  createdAt: string
  releasedAt: string | null
  completedAt: string | null
}

export interface ProductionMaterialReservation {
  id: number
  productionLotId: number
  stockItemId: number
  reservedMg: number
}

export interface PrintQueueItem {
  id: number
  productionLotId: number
  printerId: number | null
  priority: number
  position: number
}
