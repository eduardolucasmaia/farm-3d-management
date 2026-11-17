// Aritmética de instantes ISO-8601 em UTC. O instante atual nunca é lido aqui;
// ele chega como parâmetro `now` (princípio I).

export function addSeconds(instant: string, seconds: number): string {
  const ms = Date.parse(instant)
  if (Number.isNaN(ms)) throw new RangeError(`Instante inválido: ${instant}`)
  return new Date(ms + seconds * 1000).toISOString()
}

/** Compara dois instantes ISO-8601 UTC no mesmo formato. */
export function isBefore(a: string, b: string): boolean {
  return Date.parse(a) < Date.parse(b)
}
