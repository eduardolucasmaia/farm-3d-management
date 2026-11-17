import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { listPrinters } from '../../../infrastructure/repositories/catalog-repo.ts'
import { reais } from '../../format.ts'

// contracts/cadastros.md, /api/printers. US1 (T029) expõe a leitura; T035 (US2) acrescenta a escrita.

export const HOUR_RATE_STATEMENT = 'A taxa de hora-máquina não inclui filamento nem energia.'

export function registerPrinterRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/printers', { preHandler: app.requireRoles('Production', 'Operator', 'Admin') }, async () =>
    listPrinters(deps.db).map((printer) => ({
      id: printer.id,
      name: printer.name,
      model: printer.model,
      isActive: printer.is_active === 1,
      operationalStatus: printer.operational_status,
      costPerHour: reais(printer.cost_cents_per_hour),
      maintenanceLimitHours: printer.maintenance_limit_hours,
      compatibleMaterials: printer.compatibleMaterials,
      hourRateExcludesFilamentAndEnergy: true,
      hourRateStatement: HOUR_RATE_STATEMENT,
    })),
  )
}
