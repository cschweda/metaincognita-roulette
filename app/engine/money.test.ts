import { describe, it, expect } from 'vitest'
import { winningsCents, formatCents } from './money'

describe('money (integer cents)', () => {
  it('computes X:1 winnings as stake * X', () => {
    expect(winningsCents(500, 35)).toBe(17500) // $5 straight up pays $175
    expect(winningsCents(100, 1)).toBe(100)    // even money
  })
  it('formats cents as dollars', () => {
    expect(formatCents(12345)).toBe('$123.45')
    expect(formatCents(5)).toBe('$0.05')
    expect(formatCents(-50)).toBe('-$0.50')
  })
})
