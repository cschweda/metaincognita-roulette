import { describe, it, expect } from 'vitest'
import { mulberry32 } from './prng'
import { simulateSpin } from './physics'
import { WHEEL_ORDER, pocketCount } from './wheel'

describe('forward-physics landing (deterministic, seeded — spec §4)', () => {
  it('is deterministic for a given seed', () => {
    const a = simulateSpin(mulberry32(99), 'single')
    const b = simulateSpin(mulberry32(99), 'single')
    expect(a).toEqual(b)
  })
  it('returns an in-range index and the matching pocket', () => {
    const r = mulberry32(3)
    for (let i = 0; i < 500; i++) {
      const spin = simulateSpin(r, 'double')
      expect(spin.index).toBeGreaterThanOrEqual(0)
      expect(spin.index).toBeLessThan(pocketCount('double'))
      expect(spin.pocket).toBe(WHEEL_ORDER.double[spin.index])
    }
  })
  it('a strong bias concentrates outcomes into the favored arc', () => {
    const r = mulberry32(5)
    let inArc = 0
    for (let i = 0; i < 2000; i++) {
      const { index } = simulateSpin(r, 'single', { biasStrength: 1, biasCenter: 7, biasWidth: 5 })
      if (index >= 7 && index < 12) inArc++
    }
    expect(inArc).toBe(2000)
  })
})
