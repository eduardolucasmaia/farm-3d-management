import type { MaterialKind, PrinterOperationalStatus } from '../../domain/enums.ts'

// Fábrica simulada (T089). Só dados, todos fictícios, em unidades inteiras
// (data-model.md, "Unidades e representação"): centavos, mg, segundos, Wh, µm.
// Formato compacto: uma tupla por registro; índices ligam as tabelas.
// Para mudar a fábrica, edite só este arquivo e ajuste os totais do teste.

const G = 1000 // mg por grama
const MIN = 60 // segundos por minuto

export const SUPPLIERS = ['Filamentos Aurora (fictício)', 'Resinas Delta (fictício)']

export const CUSTOMERS = [
  'Oficina Bento (fictício)',
  'Loja Miriti (fictício)',
  'Estúdio Caju (fictício)',
  'Escola Tucumã (fictício)',
]

/** [nome, tipo, diâmetro µm, centavos/kg, ponto de reposição mg, fornecedor, lotes: [código, dias atrás, mg]] */
export type MaterialRow = [string, MaterialKind, number | null, number, number | null, number, [string, number, number][]]
export const MATERIALS: MaterialRow[] = [
  ['PLA preto (fictício)', 'Filament', 1750, 8990, 500 * G, 0, [['PLA-P-01 (fictício)', 40, 60 * G], ['PLA-P-02 (fictício)', 10, 1000 * G]]],
  ['PLA branco (fictício)', 'Filament', 1750, 8990, 500 * G, 0, [['PLA-B-01 (fictício)', 35, 1000 * G], ['PLA-B-02 (fictício)', 5, 1000 * G]]],
  ['PETG cinza (fictício)', 'Filament', 1750, 9990, 400 * G, 0, [['PETG-01 (fictício)', 30, 600 * G], ['PETG-02 (fictício)', 8, 1000 * G]]],
  ['ABS preto (fictício)', 'Filament', 1750, 9490, 300 * G, 0, [['ABS-01 (fictício)', 20, 1000 * G]]],
  // Saldo abaixo do ponto de reposição: aparece na sugestão de recompra.
  ['TPU 95A (fictício)', 'Filament', 1750, 15990, 600 * G, 0, [['TPU-01 (fictício)', 15, 500 * G]]],
  ['Resina padrão (fictício)', 'Resin', null, 24990, 300 * G, 1, [['RES-01 (fictício)', 12, 1000 * G]]],
]

/** [nome, SKU, preço centavos, material, peças/prancha, segundos/prancha, mg/prancha] */
export type ProductRow = [string, string, number, number, number, number, number]
export const PRODUCTS: ProductRow[] = [
  ['Suporte de prateleira (fictício)', 'FAB-SUP', 2500, 0, 4, 60 * MIN, 40 * G],
  ['Caixa organizadora (fictício)', 'FAB-CXA', 6900, 1, 2, 180 * MIN, 120 * G],
  ['Engrenagem 40 dentes (fictício)', 'FAB-ENG', 1800, 2, 6, 90 * MIN, 54 * G],
  ['Carcaça de sensor (fictício)', 'FAB-CAR', 4200, 3, 3, 150 * MIN, 96 * G],
  ['Capa flexível (fictício)', 'FAB-CAP', 3100, 4, 5, 75 * MIN, 35 * G],
  ['Miniatura de resina (fictício)', 'FAB-MIN', 1500, 5, 12, 240 * MIN, 60 * G],
]

/** [prefixo, quantidade, modelo, centavos/hora, Wh/hora, limite de manutenção h, preparação s, materiais aceitos] */
export type PrinterGroupRow = [string, number, string, number, number, number, number, number[]]
export const PRINTER_GROUPS: PrinterGroupRow[] = [
  ['A', 10, 'FDM 250 (fictício)', 400, 120, 200, 10 * MIN, [0, 1, 2]],
  ['B', 6, 'FDM 350 fechada (fictício)', 650, 280, 300, 15 * MIN, [0, 2, 3, 4]],
  ['R', 3, 'Resina 130 (fictício)', 500, 60, 150, 20 * MIN, [5]],
  // Lista vazia: aceita qualquer material.
  ['X', 1, 'FDM genérica (fictício)', 300, 100, 250, 10 * MIN, []],
]

/**
 * Exceções por impressora: [estado, horas acumuladas, ativa]. Quem não aparece
 * está Available, ativa, com horas derivadas da posição. Estado fora de Available
 * é cadastro fictício: não há execução por trás até a US5.
 */
export const PRINTER_OVERRIDES: Record<string, [PrinterOperationalStatus, number, boolean]> = {
  A01: ['Available', 198, true], // a 2 h da manutenção
  A03: ['Printing', 57, true],
  A05: ['AwaitingPickup', 88, true],
  A07: ['Printing', 120, true],
  A09: ['InMaintenance', 200, true], // limite atingido
  A10: ['Available', 150, false], // inativa
  B02: ['Printing', 210, true],
  B04: ['Preparing', 40, true],
  R03: ['Unavailable', 12, true],
}

export type OrderTarget = 'released' | 'approved' | 'pending' | 'cancelled'
/** [número, cliente, dias até a data prometida, destino, linhas: [produto, quantidade]] */
export type OrderRow = [string, number, number, OrderTarget, [number, number][]]
export const ORDERS: OrderRow[] = [
  ['FAB-001', 0, 3, 'released', [[0, 10]]],
  ['FAB-002', 1, 5, 'released', [[1, 5]]],
  ['FAB-003', 2, 2, 'released', [[2, 18], [0, 8]]],
  ['FAB-004', 0, 7, 'released', [[3, 7]]],
  ['FAB-005', 3, 4, 'released', [[5, 30]]],
  ['FAB-006', 1, -1, 'released', [[4, 12]]], // atrasado
  ['FAB-007', 2, 10, 'approved', [[1, 4]]],
  ['FAB-008', 3, 14, 'pending', [[2, 6]]],
  ['FAB-009', 0, 6, 'pending', [[0, 20]]],
  ['FAB-010', 1, 9, 'cancelled', [[3, 3]]],
  // Maior que o estoque de TPU: liberar é recusado, sem reserva parcial.
  ['FAB-011', 2, 12, 'approved', [[4, 200]]],
]
