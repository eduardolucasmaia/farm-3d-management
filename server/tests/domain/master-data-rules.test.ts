import { describe, expect, it } from 'vitest'
import { validatePrintProfile, validatePrinter } from '../../src/domain/rules/master-data-rules.ts'

describe('validatePrinter — FR-005 (US2 AC-3)', () => {
  it('recusa limite de manutenção zero', () => {
    const result = validatePrinter({
      name: 'Mesa 01',
      costCentsPerHour: 5000,
      energyWhPerHour: null,
      maintenanceLimitHours: 0,
      accumulatedSeconds: 0,
      preparationSeconds: 3600,
      isActive: true,
      operationalStatus: 'Available',
      compatibleMaterialIds: [],
    })
    expect(result).toMatchObject({ ok: false, code: 'MAINTENANCE_LIMIT_MUST_BE_POSITIVE' })
  })

  it('recusa limite de manutenção ausente (undefined)', () => {
    const result = validatePrinter({
      name: 'Mesa 02',
      costCentsPerHour: 5000,
      energyWhPerHour: null,
      accumulatedSeconds: 0,
      preparationSeconds: 3600,
      isActive: true,
      operationalStatus: 'Available',
      compatibleMaterialIds: [],
    } as any)
    expect(result).toMatchObject({ ok: false, code: 'MAINTENANCE_LIMIT_MUST_BE_POSITIVE' })
  })

  it('recusa limite de manutenção negativo', () => {
    const result = validatePrinter({
      name: 'Mesa 03',
      costCentsPerHour: 5000,
      energyWhPerHour: null,
      maintenanceLimitHours: -1,
      accumulatedSeconds: 0,
      preparationSeconds: 3600,
      isActive: true,
      operationalStatus: 'Available',
      compatibleMaterialIds: [],
    })
    expect(result).toMatchObject({ ok: false, code: 'MAINTENANCE_LIMIT_MUST_BE_POSITIVE' })
  })

  it('aceita limite de manutenção positivo', () => {
    const result = validatePrinter({
      name: 'Mesa 04',
      costCentsPerHour: 5000,
      energyWhPerHour: null,
      maintenanceLimitHours: 100,
      accumulatedSeconds: 0,
      preparationSeconds: 3600,
      isActive: true,
      operationalStatus: 'Available',
      compatibleMaterialIds: [],
    })
    expect(result).toEqual({ ok: true, value: true })
  })
})

describe('validatePrintProfile — FR-005 (US2 AC-3)', () => {
  it('recusa peças por prancha menores que 1', () => {
    expect(
      validatePrintProfile({
        name: 'Perfil A',
        piecesPerPlate: 0,
        secondsPerPlate: 120,
        mgPerPlate: 50,
      }),
    ).toMatchObject({ ok: false, code: 'PIECES_PER_PLATE_MUST_BE_POSITIVE' })
  })

  it('recusa segundos por prancha não maiores que zero', () => {
    expect(
      validatePrintProfile({
        name: 'Perfil A',
        piecesPerPlate: 4,
        secondsPerPlate: 0,
        mgPerPlate: 50,
      }),
    ).toMatchObject({ ok: false, code: 'SECONDS_PER_PLATE_MUST_BE_POSITIVE' })
  })

  it('recusa segundos por prancha negativos', () => {
    expect(
      validatePrintProfile({
        name: 'Perfil A',
        piecesPerPlate: 4,
        secondsPerPlate: -10,
        mgPerPlate: 50,
      }),
    ).toMatchObject({ ok: false, code: 'SECONDS_PER_PLATE_MUST_BE_POSITIVE' })
  })

  it('recusa gramas por prancha não maiores que zero', () => {
    expect(
      validatePrintProfile({
        name: 'Perfil A',
        piecesPerPlate: 4,
        secondsPerPlate: 120,
        mgPerPlate: 0,
      }),
    ).toMatchObject({ ok: false, code: 'MG_PER_PLATE_MUST_BE_POSITIVE' })
  })

  it('recusa gramas por prancha negativos', () => {
    expect(
      validatePrintProfile({
        name: 'Perfil A',
        piecesPerPlate: 4,
        secondsPerPlate: 120,
        mgPerPlate: -5,
      }),
    ).toMatchObject({ ok: false, code: 'MG_PER_PLATE_MUST_BE_POSITIVE' })
  })

  it('recusa todos os campos inválidos juntos', () => {
    const result = validatePrintProfile({
      name: 'Perfil A',
      piecesPerPlate: 0,
      secondsPerPlate: -1,
      mgPerPlate: 0,
    })
    // Apenas o primeiro erro deve ser retornado
    expect(result).toMatchObject({ ok: false })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).not.toBe('SECONDS_PER_PLATE_MUST_BE_POSITIVE')
      expect(result.code).not.toBe('MG_PER_PLATE_MUST_BE_POSITIVE')
    }
  })

  it('aceita valores válidos', () => {
    const result = validatePrintProfile({
      name: 'Perfil B',
      piecesPerPlate: 4,
      secondsPerPlate: 180,
      mgPerPlate: 75,
    })
    expect(result).toEqual({ ok: true, value: true })
  })
})
