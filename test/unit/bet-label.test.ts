import { describe, it, expect } from 'vitest'
import { betLabel, betMeaning } from '../../app/utils/betLabel'
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

  it('names the zero-adjacent bets by their table names, not grid shapes', () => {
    expect(betLabel(b('split', [0, 2]))).toBe('Split 0/2')
    expect(betLabel(b('street', [0, 1, 2]))).toBe('Trio 0/1/2')
    expect(betLabel(b('street', [0, 2, 3]))).toBe('Trio 0/2/3')
    expect(betLabel(b('corner', [0, 1, 2, 3]))).toBe('First Four')
  })

  it('names columns and dozens by position', () => {
    expect(betLabel(b('dozen', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toBe('1st 12')
    expect(betLabel(b('dozen', [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]))).toBe('2nd 12')
    expect(betLabel(b('column', [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]))).toBe('Column 3')
  })
})

describe('betMeaning', () => {
  it('explains an even-money bet on a double-zero wheel', () => {
    expect(betMeaning(b('black'), 'double')).toBe('Black — pays 1:1, wins $1 if it hits (18 of 38)')
  })

  it('explains a straight-up bet with its winnings on a double-zero wheel', () => {
    // $1 stake × 35 payout = $35 winnings; one pocket of 38.
    expect(betMeaning({ type: 'straight', numbers: [7], stakeCents: 500 }, 'double'))
      .toBe('Straight 7 — pays 35:1, wins $175 if it hits (1 of 38)')
  })

  it('uses the single-zero pocket count when the wheel is single', () => {
    expect(betMeaning(b('red'), 'single')).toBe('Red — pays 1:1, wins $1 if it hits (18 of 37)')
  })
})
