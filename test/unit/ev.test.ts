// test/unit/ev.test.ts
import { describe, it, expect } from 'vitest'
import { exactEvCents, edgePct, combinedEvCents } from '../../app/engine/ev'
import type { Bet, Rules } from '../../app/engine/bets'

// ── helpers ──────────────────────────────────────────────────────────────────
function straightBet(stakeCents: number): Bet {
  return { type: 'straight', numbers: [7], stakeCents }
}

function redBet(stakeCents: number): Bet {
  return { type: 'red', numbers: [], stakeCents }
}

const singleNone: Rules = { variant: 'single', evenMoney: 'none' }
const singleLP: Rules = { variant: 'single', evenMoney: 'la_partage' }
const doubleNone: Rules = { variant: 'double', evenMoney: 'none' }
const dblSurrender: Rules = { variant: 'double', evenMoney: 'surrender' }

// ── straight up ──────────────────────────────────────────────────────────────
describe('exactEvCents — straight up', () => {
  it('single-zero: ev ≈ −13.51¢ on a $5 stake', () => {
    expect(exactEvCents(straightBet(500), singleNone)).toBeCloseTo(-13.5135, 3)
  })

  it('single-zero: edgePct ≈ 2.70%', () => {
    expect(edgePct(straightBet(500), singleNone)).toBeCloseTo(2.7027, 3)
  })

  it('double-zero: ev ≈ −26.32¢ on a $5 stake', () => {
    expect(exactEvCents(straightBet(500), doubleNone)).toBeCloseTo(-26.3158, 3)
  })

  it('double-zero: edgePct ≈ 5.26%', () => {
    expect(edgePct(straightBet(500), doubleNone)).toBeCloseTo(5.2632, 3)
  })
})

// ── even-money (red) ──────────────────────────────────────────────────────────
describe('exactEvCents — even-money (red)', () => {
  it('single-zero, no rule: edgePct ≈ 2.70%', () => {
    expect(edgePct(redBet(1000), singleNone)).toBeCloseTo(2.7027, 3)
  })

  it('single-zero, la_partage: edgePct ≈ 1.35%', () => {
    expect(edgePct(redBet(1000), singleLP)).toBeCloseTo(1.3514, 3)
  })

  it('double-zero, no rule: edgePct ≈ 5.26%', () => {
    expect(edgePct(redBet(1000), doubleNone)).toBeCloseTo(5.2632, 3)
  })

  it('double-zero, surrender: edgePct ≈ 2.63%', () => {
    expect(edgePct(redBet(1000), dblSurrender)).toBeCloseTo(2.6316, 3)
  })
})

// ── First Five ────────────────────────────────────────────────────────────────
describe('exactEvCents — First Five (double-zero only)', () => {
  const firstFiveBet: Bet = { type: 'firstFive', numbers: [0, '00', 1, 2, 3], stakeCents: 500 }

  it('edgePct ≈ 7.89% (worst standard bet)', () => {
    expect(edgePct(firstFiveBet, doubleNone)).toBeCloseTo(7.8947, 3)
  })

  it('ev ≈ −39.47¢ on a $5 stake', () => {
    expect(exactEvCents(firstFiveBet, doubleNone)).toBeCloseTo(-39.4737, 3)
  })
})

// ── combinedEvCents ───────────────────────────────────────────────────────────
describe('combinedEvCents', () => {
  it('equals the sum of individual EVs', () => {
    const bets: Bet[] = [straightBet(500), redBet(1000)]
    const combined = combinedEvCents(bets, singleNone)
    const individual = exactEvCents(straightBet(500), singleNone) + exactEvCents(redBet(1000), singleNone)
    expect(combined).toBeCloseTo(individual, 6)
  })

  it('returns 0 for an empty bet array', () => {
    expect(combinedEvCents([], singleNone)).toBe(0)
  })
})

// ── edgePct guard ─────────────────────────────────────────────────────────────
describe('edgePct edge cases', () => {
  it('returns 0 for a zero-stake bet (no division by zero)', () => {
    expect(edgePct(straightBet(0), singleNone)).toBe(0)
  })
})
