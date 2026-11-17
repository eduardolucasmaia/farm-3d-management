// Valores exatos da tabela Enums de specs/001-reimplementar-printfarm/data-model.md.
// Sem `enum` do TypeScript (research.md item 14): objeto `as const` mais tipo união.

export const AppRole = {
  Admin: 'Admin',
  Sales: 'Sales',
  Production: 'Production',
  Purchasing: 'Purchasing',
  Operator: 'Operator',
} as const
export type AppRole = (typeof AppRole)[keyof typeof AppRole]

export const MaterialKind = {
  Filament: 'Filament',
  Resin: 'Resin',
  SparePart: 'SparePart',
  Packaging: 'Packaging',
  Other: 'Other',
} as const
export type MaterialKind = (typeof MaterialKind)[keyof typeof MaterialKind]

export const QuoteStatus = {
  Draft: 'Draft',
  Sent: 'Sent',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Expired: 'Expired',
  OrderGenerated: 'OrderGenerated',
} as const
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]

export const CommercialOrderStatus = {
  QuotePending: 'QuotePending',
  Approved: 'Approved',
  InProduction: 'InProduction',
  AwaitingFinishing: 'AwaitingFinishing',
  ReadyToShip: 'ReadyToShip',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
} as const
export type CommercialOrderStatus = (typeof CommercialOrderStatus)[keyof typeof CommercialOrderStatus]

export const ProductionLotStatus = {
  AwaitingPlanning: 'AwaitingPlanning',
  Released: 'Released',
  Queued: 'Queued',
  Printing: 'Printing',
  Paused: 'Paused',
  AwaitingPickup: 'AwaitingPickup',
  Completed: 'Completed',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const
export type ProductionLotStatus = (typeof ProductionLotStatus)[keyof typeof ProductionLotStatus]

export const PrinterOperationalStatus = {
  Available: 'Available',
  Printing: 'Printing',
  AwaitingPickup: 'AwaitingPickup',
  Preparing: 'Preparing',
  InMaintenance: 'InMaintenance',
  Unavailable: 'Unavailable',
} as const
export type PrinterOperationalStatus = (typeof PrinterOperationalStatus)[keyof typeof PrinterOperationalStatus]

export const PrintRunStatus = {
  Planned: 'Planned',
  Running: 'Running',
  Paused: 'Paused',
  Failed: 'Failed',
  Completed: 'Completed',
} as const
export type PrintRunStatus = (typeof PrintRunStatus)[keyof typeof PrintRunStatus]

export const PrintFailureReason = {
  None: 'None',
  BedAdhesion: 'BedAdhesion',
  Clog: 'Clog',
  LayerShift: 'LayerShift',
  OutOfMaterial: 'OutOfMaterial',
  Other: 'Other',
} as const
export type PrintFailureReason = (typeof PrintFailureReason)[keyof typeof PrintFailureReason]

export const PurchaseOrderStatus = {
  Draft: 'Draft',
  Sent: 'Sent',
  PartiallyReceived: 'PartiallyReceived',
  Received: 'Received',
  Cancelled: 'Cancelled',
} as const
export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus]

export const StockMovementKind = {
  PurchaseIn: 'PurchaseIn',
  ProductionOut: 'ProductionOut',
  Adjustment: 'Adjustment',
  Reserve: 'Reserve',
  Unreserve: 'Unreserve',
  Waste: 'Waste',
} as const
export type StockMovementKind = (typeof StockMovementKind)[keyof typeof StockMovementKind]

export const PaymentMethod = {
  Cash: 'Cash',
  Card: 'Card',
  Pix: 'Pix',
  BankTransfer: 'BankTransfer',
  Other: 'Other',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && Object.hasOwn(AppRole, value)
}
