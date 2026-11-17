import type { ProductionLotStatus } from '../../domain/enums.ts'
import { fail, type Result } from '../../domain/result.ts'
import { queueAction, transitionLot } from '../../domain/rules/lot-state.ts'
import { checkPrinterCompatibility } from '../../domain/rules/printer-compatibility.ts'
import type { Db } from '../../infrastructure/db/database.ts'
import { getPrinter } from '../../infrastructure/repositories/catalog-repo.ts'
import {
  getLot,
  getQueueItem,
  insertQueueItem,
  updateLotStatus,
  updateQueueItem,
} from '../../infrastructure/repositories/production-repo.ts'
import { abort, transact } from '../transaction.ts'

// T028 e T081: lote Released sem item cria o item e vai a Queued; lote com item só atualiza
// impressora e prioridade, sem duplicar. A impressora é checada por checkPrinterCompatibility.

export interface EnqueuedLot {
  id: number
  status: ProductionLotStatus
  printerId: number | null
  priority: number
  position: number
  /** true quando criou o item de fila (201); false quando atualizou (200). */
  created: boolean
}

export function enqueueLot(
  db: Db,
  command: { lotId: number; printerId: number | null; priority: number; now: string },
): Result<EnqueuedLot> {
  return transact(db, () => {
    const lot = getLot(db, command.lotId)
    if (!lot) abort(fail('LOT_NOT_FOUND', 'Lote de produção não encontrado.'))

    const existing = getQueueItem(db, lot.id)
    const action = queueAction(lot.status, existing !== undefined)
    if (!action.ok) abort(action)

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

    if (action.value === 'update' && existing) {
      updateQueueItem(db, lot.id, command.printerId, command.priority)
      return {
        id: lot.id,
        status: lot.status,
        printerId: command.printerId,
        priority: command.priority,
        position: existing.position,
        created: false,
      }
    }

    const next = transitionLot(lot.status, 'enqueue')
    if (!next.ok) abort(next)
    const position = insertQueueItem(db, lot.id, command.printerId, command.priority, command.now)
    updateLotStatus(db, lot.id, next.value)
    return {
      id: lot.id,
      status: next.value,
      printerId: command.printerId,
      priority: command.priority,
      position,
      created: true,
    }
  })
}
