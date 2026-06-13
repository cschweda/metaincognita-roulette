import { describe, it, expect } from 'vitest'
import { rouletteConfig } from '../../roulette.config'
import { PAYOUTS } from '../../app/engine/bets'

describe('roulette.config', () => {
  it('exposes the storage keys (versioned)', () => {
    expect(rouletteConfig.storage.sessionKey).toBe('roulette-session-v1')
    expect(rouletteConfig.storage.statsKey).toBe('roulette-training-v1')
  })
  it('exposes rule presets with their house edges', () => {
    const eu = rouletteConfig.presets.find(p => p.id === 'european')
    expect(eu).toBeTruthy()
    expect(eu!.variant).toBe('single')
    expect(eu!.evenMoney).toBe('none')
  })
  it('payout ratios match the engine pay table exactly', () => {
    for (const [type, x] of Object.entries(rouletteConfig.payouts)) {
      expect(x).toBe(PAYOUTS[type as keyof typeof PAYOUTS])
    }
  })
  it('stake tiers are ordered and in integer cents', () => {
    expect(rouletteConfig.stakes.length).toBeGreaterThanOrEqual(3)
    for (const s of rouletteConfig.stakes) {
      expect(Number.isInteger(s.minBetCents)).toBe(true)
      expect(s.maxBetCents).toBeGreaterThan(s.minBetCents)
    }
  })
})
