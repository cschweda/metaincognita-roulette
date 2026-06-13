import { describe, it, expect } from 'vitest'
import { WHEEL_ORDER, REDS, colorOf, pocketCount } from './wheel'

describe('wheel data (Arizona §L / Crown Melbourne Diagrams D & G)', () => {
  it('single-zero has 37 pockets starting at 0, with the regulated order', () => {
    expect(pocketCount('single')).toBe(37)
    expect(WHEEL_ORDER.single.slice(0, 6)).toEqual([0, 32, 15, 19, 4, 21])
    expect(WHEEL_ORDER.single.at(-1)).toBe(26)
  })
  it('double-zero has 38 pockets with 00 in the regulated position', () => {
    expect(pocketCount('double')).toBe(38)
    expect(WHEEL_ORDER.double.slice(0, 6)).toEqual([0, 28, 9, 26, 30, 11])
    expect(WHEEL_ORDER.double[19]).toBe('00')
  })
  it('has 18 red numbers and colors zero(s) green', () => {
    expect(REDS.size).toBe(18)
    expect(colorOf(1)).toBe('red')
    expect(colorOf(2)).toBe('black')
    expect(colorOf(0)).toBe('green')
    expect(colorOf('00')).toBe('green')
  })
})
