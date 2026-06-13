import { describe, it, expect } from 'vitest'
import { runFrequencies, chiSquare, measureEdge } from './sim'
import type { Bet, Rules } from './bets'
import type { Variant } from './wheel'

const SPINS = 1_000_000

describe('§2.4 fairness proof — the wheel is uniform', () => {
  it('single-zero passes χ² uniformity (df=36, well under the 99.9% critical ≈ 70)', () => {
    const chi = chiSquare(runFrequencies('single', SPINS, 0xc0ffee))
    expect(chi).toBeLessThan(70)
  })
  it('double-zero passes χ² uniformity (df=37, well under ≈ 71)', () => {
    const chi = chiSquare(runFrequencies('double', SPINS, 0xbada55))
    expect(chi).toBeLessThan(71)
  })
})

// Average the empirical edge over several seeds so the gate reflects convergence to
// theory, not a single seed's Monte-Carlo luck. Tolerances are ~3.5σ of the averaged
// estimate (the §2.4 standard). First Five has higher variance, so it uses more seeds.
function avgEdge(variant: Variant, makeBet: () => Bet, rules: Rules, spins: number, seeds: number[]): number {
  let total = 0
  for (const seed of seeds) total += measureEdge(variant, makeBet, rules, spins, seed)
  return total / seeds.length
}

describe('§2.4 fairness proof — edges converge to theory (averaged over seeds)', () => {
  const red = (): Bet => ({ type: 'red', numbers: [], stakeCents: 100 })

  it('European red converges to 2.70%', () => {
    const edge = avgEdge('single', red, { variant: 'single', evenMoney: 'none' }, SPINS, [1, 2, 3, 4])
    expect(Math.abs(edge - 0.027)).toBeLessThan(0.002)
  })
  it('American red converges to 5.26%', () => {
    const edge = avgEdge('double', red, { variant: 'double', evenMoney: 'none' }, SPINS, [1, 2, 3, 4])
    expect(Math.abs(edge - 0.0526)).toBeLessThan(0.002)
  })
  it('American First Five is the worst bet at 7.89%', () => {
    const basket = (): Bet => ({ type: 'firstFive', numbers: [0, '00', 1, 2, 3], stakeCents: 100 })
    const edge = avgEdge('double', basket, { variant: 'double', evenMoney: 'none' }, SPINS, [1, 2, 3, 4, 5, 6])
    expect(Math.abs(edge - 0.0789)).toBeLessThan(0.0035)
  })
  it('La Partage halves the European even-money edge to 1.35%', () => {
    const edge = avgEdge('single', red, { variant: 'single', evenMoney: 'la_partage' }, SPINS, [1, 2, 3, 4])
    expect(Math.abs(edge - 0.0135)).toBeLessThan(0.002)
  })
})
