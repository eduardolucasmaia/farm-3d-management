import type { MaterialKind, StockMovementKind } from '../enums.ts'

// Tipos de material e estoque (data-model.md, "Material e estoque"). Só tipos.

export interface Supplier {
  id: number
  name: string
  paymentTerms: string | null
  averageLeadTimeDays: number | null
  contact: string | null
}

export interface Material {
  id: number
  name: string
  kind: MaterialKind
  brand: string | null
  diameterUm: number | null
  colorId: number | null
  referenceCostCentsPerKg: number
  reorderPointMg: number | null
}

export interface MaterialLot {
  id: number
  materialId: number
  supplierId: number
  lotCode: string
  receivedAt: string
  initialWeightMg: number
  currentWeightMg: number
  costCentsPerKg: number
}

export interface StockItem {
  id: number
  materialId: number
  materialLotId: number | null
  quantityMg: number
  reservedMg: number
}

export interface StockMovement {
  id: number
  kind: StockMovementKind
  materialId: number
  stockItemId: number | null
  quantityMg: number
  unitCostCentsPerKg: number
  createdAt: string
  userId: string
  productionLotId: number | null
  printRunId: number | null
  purchaseReceiptId: number | null
}
