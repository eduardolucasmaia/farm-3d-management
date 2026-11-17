import type { Db } from '../db/database.ts'

// research.md item 5. Cada história acrescenta seu efeito aqui, só acréscimo:
// US3 expira orçamentos (T044), US4 sugere recompra (T050), US7 conta prazos (T066).

export interface HourlyPassReport {
  ranAt: string
}

export function runHourlyPass(_db: Db, now: string): HourlyPassReport {
  return { ranAt: now }
}

export const HOURLY_INTERVAL_MS = 60 * 60 * 1000
