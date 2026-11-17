// Rótulos de tela do vocabulário da constituição e de data-model.md.

export const lotStatusLabel: Record<string, string> = {
  AwaitingPlanning: 'Aguardando planejamento',
  Released: 'Liberado',
  Queued: 'Na fila',
  Printing: 'Em impressão',
  Paused: 'Pausado',
  AwaitingPickup: 'Aguardando retirada',
  Completed: 'Concluído',
  Failed: 'Falha',
  Cancelled: 'Cancelado',
}

export const printerStatusLabel: Record<string, string> = {
  Available: 'Disponível',
  Printing: 'Em impressão',
  AwaitingPickup: 'Aguardando retirada',
  Preparing: 'Em preparação',
  InMaintenance: 'Em manutenção',
  Unavailable: 'Indisponível',
}

export const orderStatusLabel: Record<string, string> = {
  QuotePending: 'Confirmação pendente',
  Approved: 'Confirmado',
  InProduction: 'Em produção',
  AwaitingFinishing: 'Aguardando acabamento',
  ReadyToShip: 'Pronto para envio',
  Delivered: 'Entregue',
  Cancelled: 'Cancelado',
}

export const roleLabel: Record<string, string> = {
  Admin: 'Admin',
  Sales: 'Vendas',
  Production: 'Produção',
  Purchasing: 'Compras',
  Operator: 'Operador',
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: 3 })
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
