import { describe, it, expect } from 'vitest'
import { PAYOUTS, COLUMNS, DOZENS, coverage, settleBet, type Bet, type Rules } from './bets'

const AMERICAN: Rules = { variant: 'double', evenMoney: 'none' }
const EUROPEAN: Rules = { variant: 'single', evenMoney: 'none' }

describe('pay table (Arizona / Melbourne / Colorado — identical)', () => {
  it('pins every payout', () => {
    expect(PAYOUTS).toMatchObject({
      straight: 35, split: 17, street: 11, corner: 8, firstFive: 6, sixline: 5,
      column: 2, dozen: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
    })
  })
})

describe('coverage', () => {
  it('covers the right pockets for outside bets', () => {
    expect(coverage({ type: 'red', numbers: [], stakeCents: 100 }).size).toBe(18)
    expect([...coverage({ type: 'low', numbers: [], stakeCents: 100 })].sort((a, b) => +a - +b)[0]).toBe(1)
    expect(coverage({ type: 'high', numbers: [], stakeCents: 100 }).has(36)).toBe(true)
    expect(coverage({ type: 'column', numbers: COLUMNS[0]!, stakeCents: 100 }).has(34)).toBe(true)
    expect(coverage({ type: 'dozen', numbers: DOZENS[2]!, stakeCents: 100 }).has(25)).toBe(true)
  })
})

describe('settlement', () => {
  it('pays a winning straight up: stake back + 35x', () => {
    const bet: Bet = { type: 'straight', numbers: [17], stakeCents: 100 }
    expect(settleBet(bet, 17, EUROPEAN)).toEqual({ won: true, returnCents: 3600 })
  })
  it('collects a losing straight up', () => {
    const bet: Bet = { type: 'straight', numbers: [17], stakeCents: 100 }
    expect(settleBet(bet, 18, EUROPEAN)).toEqual({ won: false, returnCents: 0 })
  })
  it('pays the American First Five (0,00,1,2,3) at 6:1', () => {
    const bet: Bet = { type: 'firstFive', numbers: [0, '00', 1, 2, 3], stakeCents: 100 }
    expect(settleBet(bet, 2, AMERICAN)).toEqual({ won: true, returnCents: 700 })
  })
  it('loses even-money bets on zero with no rule', () => {
    const bet: Bet = { type: 'red', numbers: [], stakeCents: 100 }
    expect(settleBet(bet, 0, EUROPEAN)).toEqual({ won: false, returnCents: 0 })
  })
  it('returns half on zero under La Partage', () => {
    const bet: Bet = { type: 'red', numbers: [], stakeCents: 100 }
    expect(settleBet(bet, 0, { variant: 'single', evenMoney: 'la_partage' }))
      .toEqual({ won: false, returnCents: 50 })
  })
  it('returns half on 00 under Surrender', () => {
    const bet: Bet = { type: 'even', numbers: [], stakeCents: 100 }
    expect(settleBet(bet, '00', { variant: 'double', evenMoney: 'surrender' }))
      .toEqual({ won: false, returnCents: 50 })
  })
})
