import { describe, it, expect } from 'vitest'
import { mulberry32, frac } from './prng'

describe('mulberry32 seeded PRNG', () => {
  it('is deterministic: same seed reproduces the same sequence', () => {
    const a = mulberry32(12345), b = mulberry32(12345)
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })
  it('produces values in [0, 1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const x = r()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
  it('different seeds produce different sequences', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
  it('frac returns the fractional part for negatives too', () => {
    expect(frac(3.25)).toBeCloseTo(0.25)
    expect(frac(-0.25)).toBeCloseTo(0.75)
  })
})
