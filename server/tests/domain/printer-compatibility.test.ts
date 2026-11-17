import { describe, expect, it } from 'vitest'
import { checkPrinterCompatibility, type PrinterForQueue } from '../../src/domain/rules/printer-compatibility.ts'

const PLA = 1
const PETG = 2
const mesaA: PrinterForQueue = { isActive: true, operationalStatus: 'Available', compatibleMaterialIds: [PLA] }

describe('checkPrinterCompatibility (FR-013)', () => {
  it('aceita impressora ativa, disponível e com o material na lista', () => {
    expect(checkPrinterCompatibility(mesaA, PLA)).toEqual({ ok: true, value: true })
  })

  it('lista vazia aceita qualquer material', () => {
    expect(checkPrinterCompatibility({ ...mesaA, compatibleMaterialIds: [] }, PETG).ok).toBe(true)
  })

  it('recusa material fora da lista', () => {
    expect(checkPrinterCompatibility(mesaA, PETG)).toMatchObject({ ok: false, code: 'PRINTER_INCOMPATIBLE' })
  })

  it('recusa impressora inativa', () => {
    expect(checkPrinterCompatibility({ ...mesaA, isActive: false }, PLA)).toMatchObject({
      ok: false,
      code: 'PRINTER_INACTIVE',
    })
  })

  it('recusa impressora ocupada', () => {
    for (const status of ['Printing', 'AwaitingPickup', 'Preparing'] as const) {
      expect(checkPrinterCompatibility({ ...mesaA, operationalStatus: status }, PLA)).toMatchObject({
        ok: false,
        code: 'PRINTER_BUSY',
      })
    }
  })

  it('recusa impressora em manutenção ou indisponível', () => {
    for (const status of ['InMaintenance', 'Unavailable'] as const) {
      expect(checkPrinterCompatibility({ ...mesaA, operationalStatus: status }, PLA)).toMatchObject({
        ok: false,
        code: 'PRINTER_UNAVAILABLE',
      })
    }
  })
})
