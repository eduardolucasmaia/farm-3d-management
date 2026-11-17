import type { PrinterOperationalStatus } from '../enums.ts'

// Tipos de catálogo e máquina (data-model.md, "Catálogo de produção"). Só tipos.

export interface Color {
  id: number
  name: string
  hex: string | null
}

export interface PrintProfile {
  id: number
  name: string
  materialId: number | null
  piecesPerPlate: number
  secondsPerPlate: number
  mgPerPlate: number
}

export interface Product {
  id: number
  name: string
  sku: string
  defaultSellPriceCents: number
  defaultPrintProfileId: number | null
  defaultMaterialId: number | null
  isForSale: boolean
  offeredColorIds: number[]
  offeredSizes: string[]
}

export interface Printer {
  id: number
  name: string
  model: string | null
  costCentsPerHour: number
  energyWhPerHour: number | null
  maintenanceLimitHours: number
  accumulatedSeconds: number
  preparationSeconds: number
  isActive: boolean
  operationalStatus: PrinterOperationalStatus
  /** Sempre verdadeiro: "A taxa de hora-máquina não inclui filamento nem energia." */
  hourRateExcludesFilamentAndEnergy: true
}

export interface PrinterMaterial {
  printerId: number
  materialId: number
}
