import type { CommercialOrderStatus } from '../enums.ts'

// Tipos de cliente e pedido (data-model.md, "Customer" e "Comercial"). Só tipos.

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
}

export interface SalesOrder {
  id: number
  number: string
  customerId: number
  quoteId: number | null
  commercialStatus: CommercialOrderStatus
  /** Data AAAA-MM-DD. */
  promisedDate: string | null
  freightCents: number
  packagingCents: number
  notes: string | null
  createdAt: string
}

export interface OrderLine {
  id: number
  salesOrderId: number
  productId: number
  quantity: number
  unitPriceCents: number
  materialId: number | null
  colorId: number | null
  size: string | null
}
