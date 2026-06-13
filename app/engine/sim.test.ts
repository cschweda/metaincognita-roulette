import { describe, it, expect } from 'vitest'
import { runFrequencies, chiSquare, measureEdge } from './sim'
import { type Bet, type Rules } from './bets'

const SPINS = 1_000_000

describe('§2.4 fairness proof — the wheel is uniform', () => {
  it('single-zero passes χ² uniformity (df=36, well under the 99.9% critical ≈ 70)', () => {
    const chi = chiSquare(runFrequencies('single', SPINS, 0xC0FFEE))
    expect(chi).toBeLessThan(70)
  })
  it('double-zero passes χ² uniformity (df=37, well under ≈ 71)', () => {
    const chi = chiSquare(runFrequencies('double', SPINS, 0xBADA55))
    expect(chi).toBeLessThan(71)
  })
})

describe('§2.4 fairness proof — edges converge to theory', () => {
  const red = (): Bet => ({ type: 'red', numbers: [], stakeCents: 100 })

  it('European red converges to 2.70%', () => {
    const edge = measureEdge('single', red, { variant: 'single', evenMoney: 'none' }, SPINS, 1)
    expect(edge).toBeCloseTo(0.027, 2)
  })
  it('American red converges to 5.26%', () => {
    const edge = measureEdge('double', red, { variant: 'double', evenMoney: 'none' }, SPINS, 2)
    expect(edge).toBeCloseTo(0.0526, 2)
  })
  it('American First Five is the worst bet at 7.89%', () => {
    const basket = (): Bet => ({ type: 'firstFive', numbers: [0, '00', 1, 2, 3], stakeCents: 100 })
    const edge = measureEdge('double', basket, { variant: 'double', evenMoney: 'none' }, SPINS, 3)
    expect(Math.abs(edge - 0.0789)).toBeLessThan(0.01)
  })
  it('La Partage halves the European even-money edge to 1.35%', () => {
    const edge = measureEdge('single', red, { variant: 'single', evenMoney: 'la_partage' }, SPINS, 4)
    expect(edge).toBeCloseTo(0.0135, 2)
  })
})
