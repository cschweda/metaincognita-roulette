import type { Pocket } from '~/engine/wheel'

/** House edge realized so far = -net / wagered (positive = house ahead). 0 if nothing wagered. */
export function realizedEdge(netCents: number, wageredCents: number): number {
  if (wageredCents <= 0) return 0
  return -netCents / wageredCents
}

export interface PocketCount { pocket: Pocket, count: number }
export function pocketCounts(history: { pocket: Pocket }[]): PocketCount[] {
  const map = new Map<string, PocketCount>()
  for (const h of history) {
    const k = String(h.pocket)
    const e = map.get(k)
    if (e) e.count++
    else map.set(k, { pocket: h.pocket, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}
