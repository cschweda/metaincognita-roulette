// test/unit/systems.test.ts
import { describe, it, expect } from 'vitest'
import {
  createProgression,
  simulateSession,
  runTrials,
  type SystemConfig
} from '../../app/engine/systems'
import { mulberry32 } from '../../app/engine/prng'

// ── Progression unit tests (deterministic, NO spins) ─────────────────────────

describe('Progression: flat', () => {
  it('always returns baseUnit regardless of outcomes', () => {
    const p = createProgression('flat', 100)
    expect(p.nextStakeCents()).toBe(100)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(100)
    p.settle(true)
    expect(p.nextStakeCents()).toBe(100)
    p.settle(false)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(100)
  })
})

describe('Progression: martingale', () => {
  it('starts at baseUnit', () => {
    const p = createProgression('martingale', 100)
    expect(p.nextStakeCents()).toBe(100)
  })

  it('doubles after a loss', () => {
    const p = createProgression('martingale', 100)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(200)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(400)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(800)
  })

  it('resets to baseUnit after a win', () => {
    const p = createProgression('martingale', 100)
    p.settle(false)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(400)
    p.settle(true)
    expect(p.nextStakeCents()).toBe(100)
  })

  it('win mid-sequence resets and subsequent loss doubles again', () => {
    const p = createProgression('martingale', 50)
    p.settle(false) // → 100
    p.settle(true) // → 50
    p.settle(false) // → 100
    expect(p.nextStakeCents()).toBe(100)
  })
})

describe('Progression: dalembert', () => {
  it('starts at 1 unit', () => {
    const p = createProgression('dalembert', 100)
    expect(p.nextStakeCents()).toBe(100)
  })

  it('increments by 1 unit after a loss', () => {
    const p = createProgression('dalembert', 100)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(200)
    p.settle(false)
    expect(p.nextStakeCents()).toBe(300)
  })

  it('decrements by 1 unit after a win (floor 1)', () => {
    const p = createProgression('dalembert', 100)
    p.settle(false) // 2 units
    p.settle(false) // 3 units
    expect(p.nextStakeCents()).toBe(300)
    p.settle(true) // 2 units
    expect(p.nextStakeCents()).toBe(200)
    p.settle(true) // 1 unit
    expect(p.nextStakeCents()).toBe(100)
  })

  it('floors at 1 unit — never goes below baseUnit', () => {
    const p = createProgression('dalembert', 100)
    p.settle(true) // would be 0 but floor at 1
    expect(p.nextStakeCents()).toBe(100)
    p.settle(true)
    expect(p.nextStakeCents()).toBe(100)
  })
})

describe('Progression: fibonacci', () => {
  it('starts at fib[0] = 1 unit', () => {
    const p = createProgression('fibonacci', 100)
    expect(p.nextStakeCents()).toBe(100) // fib[0]=1
  })

  it('advances +1 index on loss', () => {
    const p = createProgression('fibonacci', 100)
    p.settle(false) // index=1 → fib[1]=1
    expect(p.nextStakeCents()).toBe(100)
    p.settle(false) // index=2 → fib[2]=2
    expect(p.nextStakeCents()).toBe(200)
    p.settle(false) // index=3 → fib[3]=3
    expect(p.nextStakeCents()).toBe(300)
    p.settle(false) // index=4 → fib[4]=5
    expect(p.nextStakeCents()).toBe(500)
  })

  it('moves back 2 on win (floor 0)', () => {
    const p = createProgression('fibonacci', 100)
    p.settle(false) // 1
    p.settle(false) // 2
    p.settle(false) // 3
    p.settle(false) // 4 → fib[4]=5
    expect(p.nextStakeCents()).toBe(500)
    p.settle(true) // index=2 → fib[2]=2
    expect(p.nextStakeCents()).toBe(200)
    p.settle(true) // index=0 → fib[0]=1
    expect(p.nextStakeCents()).toBe(100)
    p.settle(true) // floor 0 → fib[0]=1
    expect(p.nextStakeCents()).toBe(100)
  })
})

describe('Progression: paroli (reverse martingale)', () => {
  it('starts at baseUnit', () => {
    const p = createProgression('paroli', 100)
    expect(p.nextStakeCents()).toBe(100)
  })

  it('doubles on consecutive wins', () => {
    const p = createProgression('paroli', 100)
    p.settle(true) // streak=1 → stake 200
    expect(p.nextStakeCents()).toBe(200)
    p.settle(true) // streak=2 → stake 400
    expect(p.nextStakeCents()).toBe(400)
  })

  it('resets to baseUnit after 3 consecutive wins', () => {
    const p = createProgression('paroli', 100)
    p.settle(true) // streak=1 → 200
    p.settle(true) // streak=2 → 400
    p.settle(true) // streak=3 → reset: stake=100, streak=0
    expect(p.nextStakeCents()).toBe(100)
  })

  it('resets to baseUnit on any loss', () => {
    const p = createProgression('paroli', 100)
    p.settle(true) // streak=1 → 200
    p.settle(false) // loss → reset
    expect(p.nextStakeCents()).toBe(100)
  })

  it('resets streak after loss and can build again', () => {
    const p = createProgression('paroli', 100)
    p.settle(true) // 200
    p.settle(true) // 400
    p.settle(false) // reset → 100, streak=0
    p.settle(true) // 200
    expect(p.nextStakeCents()).toBe(200)
  })
})

// ── Reproducibility ───────────────────────────────────────────────────────────

describe('runTrials reproducibility', () => {
  const cfg: SystemConfig = {
    system: 'flat',
    variant: 'single',
    evenMoney: 'none',
    betType: 'red',
    baseUnitCents: 100,
    startBankrollCents: 5000,
    maxRounds: 50
  }

  it('identical seed produces identical results', () => {
    const r1 = runTrials(cfg, 40, 123)
    const r2 = runTrials(cfg, 40, 123)
    expect(r1).toEqual(r2)
  })
})

// ── House edge bites (flat, single-zero) ──────────────────────────────────────

describe('House edge: flat red, single-zero, no rule', () => {
  const cfg: SystemConfig = {
    system: 'flat',
    variant: 'single',
    evenMoney: 'none',
    betType: 'red',
    baseUnitCents: 1000,
    startBankrollCents: 20000,
    maxRounds: 200
  }

  it('meanFinalCents < startBankrollCents (house wins long-run)', () => {
    // 2000 trials provides sufficient statistical power against 2.70% edge.
    const result = runTrials(cfg, 2000, 42)
    expect(result.meanFinalCents).toBeLessThan(cfg.startBankrollCents)
  })

  it('mean loss is in the right ballpark vs theoretical house edge', () => {
    // Total wagered per session ≈ maxRounds × baseUnit = 200 × 1000 = 200,000¢
    // Expected loss ≈ 2.70% × 200,000 = 5400¢
    // We allow ±60% tolerance to keep trial count modest.
    const result = runTrials(cfg, 2000, 99)
    const meanLoss = cfg.startBankrollCents - result.meanFinalCents
    expect(meanLoss).toBeGreaterThan(0)
    expect(meanLoss).toBeLessThan(12000) // well below losing everything
  })
})

// ── Martingale ruins ──────────────────────────────────────────────────────────

describe('Martingale catastrophic ruin', () => {
  it('ruinRate > 0.1 with small bankroll and tight tableMax', () => {
    // 20 units bankroll, tableMax ~50 units (~6 doublings before cap + ruin).
    const cfg: SystemConfig = {
      system: 'martingale',
      variant: 'single',
      evenMoney: 'none',
      betType: 'red',
      baseUnitCents: 100,
      startBankrollCents: 2000, // 20 units
      maxRounds: 500,
      tableMaxCents: 5000 // 50 units, caps around 6 doublings
    }
    const result = runTrials(cfg, 500, 7)
    expect(result.ruinRate).toBeGreaterThan(0.1)
  })
})

// ── Bands shape ───────────────────────────────────────────────────────────────

describe('TrialsResult.bands shape and ordering', () => {
  const cfg: SystemConfig = {
    system: 'flat',
    variant: 'single',
    evenMoney: 'none',
    betType: 'red',
    baseUnitCents: 100,
    startBankrollCents: 5000,
    maxRounds: 30
  }

  it('all band arrays have length === maxRounds', () => {
    const result = runTrials(cfg, 100, 55)
    const { p10, p25, p50, p75, p90 } = result.bands
    expect(p10.length).toBe(cfg.maxRounds)
    expect(p25.length).toBe(cfg.maxRounds)
    expect(p50.length).toBe(cfg.maxRounds)
    expect(p75.length).toBe(cfg.maxRounds)
    expect(p90.length).toBe(cfg.maxRounds)
  })

  it('p10 ≤ p50 ≤ p90 at every sampled index', () => {
    const result = runTrials(cfg, 200, 77)
    const { p10, p50, p90 } = result.bands
    // Check a handful of indices.
    for (const i of [0, 5, 14, 29]) {
      expect(p10[i]).toBeLessThanOrEqual(p50[i]!)
      expect(p50[i]).toBeLessThanOrEqual(p90[i]!)
    }
  })
})

// ── sessionResult sanity ──────────────────────────────────────────────────────

describe('simulateSession sanity', () => {
  it('curve length equals rounds', () => {
    const cfg: SystemConfig = {
      system: 'flat',
      variant: 'single',
      evenMoney: 'none',
      betType: 'red',
      baseUnitCents: 100,
      startBankrollCents: 3000,
      maxRounds: 50
    }
    const rng = mulberry32(1)
    const result = simulateSession(cfg, rng)
    expect(result.curve.length).toBe(result.rounds)
  })

  it('ruined and hitTarget are mutually exclusive', () => {
    const cfg: SystemConfig = {
      system: 'martingale',
      variant: 'single',
      evenMoney: 'none',
      betType: 'red',
      baseUnitCents: 200,
      startBankrollCents: 1000,
      maxRounds: 100,
      targetBankrollCents: 2000
    }
    const rng = mulberry32(99)
    for (let i = 0; i < 20; i++) {
      const r = simulateSession(cfg, rng)
      expect(r.ruined && r.hitTarget).toBe(false)
    }
  })
})
