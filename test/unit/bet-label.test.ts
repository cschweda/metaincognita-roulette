import { describe, it, expect } from 'vitest'
import { betLabel } from '../../app/utils/betLabel'
import type { Bet, BetType } from '../../app/engine/bets'
import type { Pocket } from '../../app/engine/wheel'

const b = (type: BetType, numbers: Pocket[] = []): Bet => ({ type, numbers, stakeCents: 100 })

describe('betLabel', () => {
  it('names outside bets', () => {
    expect(betLabel(b('red'))).toBe('Red')
    expect(betLabel(b('black'))).toBe('Black')
    expect(betLabel(b('low'))).toBe('1–18')
    expect(betLabel(b('high'))).toBe('19–36')
  })

  it('names inside bets with their numbers', () => {
    expect(betLabel(b('straight', [7]))).toBe('Straight 7')
    expect(betLabel(b('split', [7, 8]))).toBe('Split 7/8')
    expect(betLabel(b('corner', [7, 8, 10, 11]))).toBe('Corner 7–11')
    expect(betLabel(b('firstFive', [0, '00', 1, 2, 3]))).toBe('First Five')
  })

  it('names columns and dozens by position', () => {
    expect(betLabel(b('dozen', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toBe('1st 12')
    expect(betLabel(b('dozen', [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]))).toBe('2nd 12')
    expect(betLabel(b('column', [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]))).toBe('Column 3')
  })
})
