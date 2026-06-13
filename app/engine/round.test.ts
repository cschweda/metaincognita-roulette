import { describe, it, expect } from 'vitest'
import { RouletteGame } from './round'
import { mulberry32 } from './prng'
import { simulateSpin } from './physics'
import type { Rules } from './bets'

const EUROPEAN: Rules = { variant: 'single', evenMoney: 'none' }

describe('RouletteGame round machine', () => {
  it('plays a deterministic round and reports net P&L from a seed', () => {
    const r1 = new RouletteGame(EUROPEAN, 42).playRound([{ type: 'red', numbers: [], stakeCents: 100 }])
    const r2 = new RouletteGame(EUROPEAN, 42).playRound([{ type: 'red', numbers: [], stakeCents: 100 }])
    expect(r2.pocket).toBe(r1.pocket) // same seed -> same pocket

    expect(r1.totalStakeCents).toBe(100)
    expect(r1.netCents).toBe(r1.totalReturnCents - 100)
    expect(r1.events.map(e => e.type)).toEqual(['no-more-bets', 'ball-settled', 'settled'])
  })

  it('advances the stream so rounds are not all identical', () => {
    const game = new RouletteGame(EUROPEAN, 7)
    const pockets = Array.from({ length: 20 }, () => game.playRound([]).pocket)
    expect(new Set(pockets).size).toBeGreaterThan(1) // the stream advances; not stuck on one pocket
  })

  it('settles a winning straight up correctly', () => {
    // Find a seed whose first single-zero spin lands on 17, then bet it.
    // The game's first spin == simulateSpin(mulberry32(seed), 'single'), so the seed matches.
    let seed = 0
    while (simulateSpin(mulberry32(seed), 'single').pocket !== 17) seed++
    const r = new RouletteGame(EUROPEAN, seed).playRound([{ type: 'straight', numbers: [17], stakeCents: 100 }])
    expect(r.pocket).toBe(17)
    expect(r.netCents).toBe(3500) // 3600 returned - 100 staked
  })
})
