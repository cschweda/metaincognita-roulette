import { describe, it, expect } from 'vitest'
import { chiCritical, isUniform } from '../../app/components/lab/sandbox'

describe('sandbox verdict', () => {
  it('a chi-square near df is uniform; a huge one is not', () => {
    expect(isUniform(36, 36)).toBe(true)
    expect(isUniform(200, 36)).toBe(false)
  })
  it('critical value grows with df', () => {
    expect(chiCritical(37)).toBeGreaterThan(chiCritical(36))
  })
  it('matches the 99.9% χ² table for the wheel dfs (±0.5): df=36 → ≈68.0, df=37 → ≈69.3', () => {
    // Table values: χ²₀.₉₉₉(36) = 67.985, χ²₀.₉₉₉(37) = 69.346. The old normal
    // approximation (df + 3.09√(2df)) gave ≈62 — flagging ~1% of true wheels
    // as biased instead of the advertised 0.1%.
    expect(Math.abs(chiCritical(36) - 67.985)).toBeLessThan(0.5)
    expect(Math.abs(chiCritical(37) - 69.346)).toBeLessThan(0.5)
  })
})
