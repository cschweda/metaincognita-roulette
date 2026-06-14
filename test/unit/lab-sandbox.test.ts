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
})
