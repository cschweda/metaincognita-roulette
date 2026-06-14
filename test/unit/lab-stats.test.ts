import { describe, it, expect } from 'vitest'
import { realizedEdge, pocketCounts } from '../../app/components/lab/labStats'

describe('lab stats', () => {
  it('computes realized house edge as -net/wagered', () => {
    expect(realizedEdge(-27, 1000)).toBeCloseTo(0.027, 4) // lost 27 of 1000 wagered → 2.7% edge
    expect(realizedEdge(500, 1000)).toBeCloseTo(-0.5, 4) // player up → negative "house edge"
    expect(realizedEdge(0, 0)).toBe(0)
  })
  it('counts pockets, most frequent first', () => {
    const counts = pocketCounts([{ pocket: 7 }, { pocket: 7 }, { pocket: 0 }])
    expect(counts[0]!.pocket).toBe(7)
    expect(counts[0]!.count).toBe(2)
  })
})
