import type { PrinterOperationalStatus } from '../enums.ts'
import { fail, ok, type Result } from '../result.ts'

// FR-013 e FR-005; contracts/producao.md, POST /api/lots/{id}/queue.

export interface PrinterForQueue {
  isActive: boolean
  operationalStatus: PrinterOperationalStatus
  /** Lista vazia significa compatível com qualquer material. */
  compatibleMaterialIds: readonly number[]
}

const BUSY: readonly PrinterOperationalStatus[] = ['Printing', 'AwaitingPickup', 'Preparing']

export function checkPrinterCompatibility(printer: PrinterForQueue, materialId: number): Result<true> {
  if (!printer.isActive) {
    return fail('PRINTER_INACTIVE', 'Impressora inativa não recebe lote.')
  }
  if (BUSY.includes(printer.operationalStatus)) {
    return fail('PRINTER_BUSY', 'Impressora ocupada: ainda não passou por retirada e preparação.')
  }
  if (printer.operationalStatus !== 'Available') {
    return fail('PRINTER_UNAVAILABLE', 'Impressora em manutenção ou indisponível não recebe lote.')
  }
  if (printer.compatibleMaterialIds.length > 0 && !printer.compatibleMaterialIds.includes(materialId)) {
    return fail('PRINTER_INCOMPATIBLE', 'A impressora não aceita o material deste lote.')
  }
  return ok(true)
}
