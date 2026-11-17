import type { ProductionLotStatus } from '../../domain/enums.ts'
import { fail, type Result } from '../../domain/result.ts'
import { transitionLot } from '../../domain/rules/lot-state.ts'
import { checkPrinterCompatibility } from '../../domain/rules/printer-compatibility.ts'
import type { Db } from '../../infrastructure/db/database.ts'
import { getPrinter } from '../../infrastructure/repositories/catalog-repo.ts'
import { getLot, insertQueueItem, updateLotStatus } from '../../infrastructure/repositories/production-repo.ts'
import { abort, transact } from '../transaction.ts'

// T028: Released -> Queued, com impressora opcional checada por checkPrinterCompatibility.

export interface EnqueuedLot {
  id: number
  status: ProductionLotStatus
  printerId: number | null
  position: number
}

export function enqueueLot(
  db: Db,
  command: { lotId: number; printerId: number | null; priority: number; now: string },
): Result<EnqueuedLot> {
  return transact(db, () => {
    const lot = getLot(db, command.lotId)
    if (!lot) abort(fail('LOT_NOT_FOUND', 'Lote de produção não encontrado.'))

    const next = transitionLot(lot.status, 'enqueue')
    if (!next.ok) abort(next)

    if (command.printerId !== null) {
      const printer = getPrinter(db, command.printerId)
      if (!printer) abort(fail('PRINTER_NOT_FOUND', 'Impressora não encontrada.'))
      const check = checkPrinterCompatibility(
        {
          isActive: printer.is_active === 1,
          operationalStatus: printer.operational_status,
          compatibleMaterialIds: printer.compatibleMaterials.map((material) => material.id),
        },
        lot.material_id,
      )
      if (!check.ok) abort(check)
    }

    const position = insertQueueItem(db, lot.id, command.printerId, command.priority, command.now)
    updateLotStatus(db, lot.id, next.value)
    return { id: lot.id, status: next.value, printerId: command.printerId, position }
  })
}
