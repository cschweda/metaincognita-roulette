import { describe, it, expect } from 'vitest'
import { formatCents, formatSignedCents } from '../../app/utils/format'

describe('formatCents', () => {
  it('whole dollars drop the cents', () => {
    expect(formatCents(500)).toBe('$5')
  })
  it('fractional dollars keep two decimals', () => {
    expect(formatCents(250)).toBe('$2.50')
  })
  it('thousands round to whole dollars with a separator', () => {
    expect(formatCents(123_456)).toBe('$1,235')
  })
})

describe('formatSignedCents', () => {
  it('prefixes gains with +', () => {
    expect(formatSignedCents(500)).toBe('+$5')
    expect(formatSignedCents(17_500)).toBe('+$175')
  })
  it('prefixes losses with a minus — a $5 loss must not render as "$5"', () => {
    expect(formatSignedCents(-500)).toBe('−$5')
    expect(formatSignedCents(-250)).toBe('−$2.50')
    expect(formatSignedCents(-123_456)).toBe('−$1,235')
  })
  it('renders zero unsigned', () => {
    expect(formatSignedCents(0)).toBe('$0')
  })
})
