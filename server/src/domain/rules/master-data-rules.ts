import { fail, ok, type Result } from '../result.ts'

// US2 AC-3: "Limite de horas de manutenção maior que zero."
// "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."

export interface PrinterForValidation {
  name: string
  costCentsPerHour: number
  energyWhPerHour: number | null
  maintenanceLimitHours: number
  accumulatedSeconds: number
  preparationSeconds: number
  isActive: boolean
  operationalStatus: string
  compatibleMaterialIds: readonly number[]
}

export interface PrintProfileForValidation {
  name: string
  piecesPerPlate: number
  secondsPerPlate: number
  mgPerPlate: number
}

export function validatePrinter(printer: PrinterForValidation): Result<true> {
  if (!Number.isInteger(printer.maintenanceLimitHours) || printer.maintenanceLimitHours <= 0) {
    return fail('MAINTENANCE_LIMIT_MUST_BE_POSITIVE', 'Limite de horas de manutenção maior que zero.')
  }
  return ok(true)
}

export function validatePrintProfile(profile: PrintProfileForValidation): Result<true> {
  if (profile.piecesPerPlate < 1) {
    return fail('PIECES_PER_PLATE_MUST_BE_POSITIVE', 'Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero.')
  }
  if (profile.secondsPerPlate <= 0) {
    return fail('SECONDS_PER_PLATE_MUST_BE_POSITIVE', 'Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero.')
  }
  if (profile.mgPerPlate <= 0) {
    return fail('MG_PER_PLATE_MUST_BE_POSITIVE', 'Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero.')
  }
  return ok(true)
}
