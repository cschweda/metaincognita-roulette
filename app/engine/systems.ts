// app/engine/systems.ts
// Pure-TypeScript betting-system Monte-Carlo simulator.
// NO Vue/Nuxt/Pinia/app imports — only other app/engine/ modules + standard JS.
// Math.random() is BANNED — use the seeded PRNG only.
import type { Variant } from './wheel'
import { type Rng, mulberry32 } from './prng'
import { type Bet, type EvenMoneyRule, type BetType, settleBet } from './bets'
import { simulateSpin } from './physics'

// ── public types ──────────────────────────────────────────────────────────────

export type SystemId = 'flat' | 'martingale' | 'dalembert' | 'fibonacci' | 'paroli'

export interface SystemConfig {
  system: SystemId
  variant: Variant
  evenMoney: EvenMoneyRule
  betType: BetType // an even-money bet; default 'red'
  baseUnitCents: number
  startBankrollCents: number
  maxRounds: number
  targetBankrollCents?: number // stop early if reached (undefined = no target)
  tableMaxCents?: number // per-bet table limit (caps Martingale doublings)
}

export interface SessionResult {
  finalBankrollCents: number
  rounds: number // rounds actually played
  ruined: boolean // busted before maxRounds
  hitTarget: boolean
  curve: number[] // bankroll AFTER each round (length === rounds)
}

export interface TrialsResult {
  trials: number
  ruinRate: number // fraction ruined
  targetRate: number // fraction that hit target
  medianFinalCents: number
  meanFinalCents: number
  finals: number[] // every final bankroll (for an outcome histogram)
  bands: {
    p10: number[]
    p25: number[]
    p50: number[]
    p75: number[]
    p90: number[]
  } // each array has length === maxRounds
}

// ── Progression interface ─────────────────────────────────────────────────────

export interface Progression {
  /** Current desired stake in cents (before table/bankroll clamping). */
  nextStakeCents(): number
  /** Inform the progression whether the most recent round was a net win. */
  settle(won: boolean): void
}

// ── Fibonacci helper ──────────────────────────────────────────────────────────

function fibSequence(maxLen: number): number[] {
  const seq = [1, 1]
  while (seq.length < maxLen) {
    seq.push(seq[seq.length - 1]! + seq[seq.length - 2]!)
  }
  return seq
}

// Pre-generate enough Fibonacci numbers — 30 covers stakes up to fib[29]×base.
const FIB: number[] = fibSequence(60)

// ── createProgression — independently testable per-system logic ───────────────

export function createProgression(system: SystemId, baseUnitCents: number): Progression {
  switch (system) {
    case 'flat': {
      return {
        nextStakeCents: () => baseUnitCents,
        settle: (_won: boolean) => { /* stateless */ }
      }
    }

    case 'martingale': {
      let stake = baseUnitCents
      return {
        nextStakeCents: () => stake,
        settle(won: boolean) {
          stake = won ? baseUnitCents : stake * 2
        }
      }
    }

    case 'dalembert': {
      let units = 1
      return {
        nextStakeCents: () => baseUnitCents * units,
        settle(won: boolean) {
          units = won ? Math.max(1, units - 1) : units + 1
        }
      }
    }

    case 'fibonacci': {
      let index = 0
      return {
        nextStakeCents: () => baseUnitCents * (FIB[index] ?? FIB[FIB.length - 1]!),
        settle(won: boolean) {
          if (won) {
            index = Math.max(0, index - 2)
          } else {
            index = index + 1
            // Grow FIB sequence if we've somehow exhausted it (very deep losing streaks).
            while (index >= FIB.length) {
              FIB.push(FIB[FIB.length - 1]! + FIB[FIB.length - 2]!)
            }
          }
        }
      }
    }

    case 'paroli': {
      let stake = baseUnitCents
      let winStreak = 0
      return {
        nextStakeCents: () => stake,
        settle(won: boolean) {
          if (won) {
            winStreak++
            if (winStreak >= 3) {
              // Completed a 3-win run — collect and reset.
              stake = baseUnitCents
              winStreak = 0
            } else {
              stake = stake * 2
            }
          } else {
            stake = baseUnitCents
            winStreak = 0
          }
        }
      }
    }
  }
}

// ── simulateSession ───────────────────────────────────────────────────────────

export function simulateSession(config: SystemConfig, rng: Rng): SessionResult {
  const {
    system,
    variant,
    evenMoney,
    betType,
    baseUnitCents,
    startBankrollCents,
    maxRounds,
    targetBankrollCents,
    tableMaxCents
  } = config

  const rules = { variant, evenMoney }
  const progression = createProgression(system, baseUnitCents)

  let bankroll = startBankrollCents
  let rounds = 0
  let ruined = false
  let hitTarget = false
  const curve: number[] = []

  while (rounds < maxRounds && bankroll >= baseUnitCents) {
    // 1. Determine stake.
    const desired = progression.nextStakeCents()
    const cap = tableMaxCents !== undefined ? Math.min(desired, tableMaxCents) : desired
    const actual = Math.min(cap, bankroll)
    if (actual <= 0) break

    // 2. Spin and settle.
    const { pocket } = simulateSpin(rng, variant)
    const bet: Bet = { type: betType, numbers: [], stakeCents: actual }
    const { returnCents } = settleBet(bet, pocket, rules)

    // 3. Update bankroll.
    bankroll += returnCents - actual
    curve.push(bankroll)
    rounds++

    // 4. Net result for progression (strictly > 0 means win).
    const net = returnCents - actual
    progression.settle(net > 0)

    // 5. Target check.
    if (targetBankrollCents !== undefined && bankroll >= targetBankrollCents) {
      hitTarget = true
      break
    }
  }

  if (!hitTarget && bankroll < baseUnitCents) {
    ruined = true
  }

  return { finalBankrollCents: bankroll, rounds, ruined, hitTarget, curve }
}

// ── Percentile helper ─────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]!
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo)
}

// ── runTrials ─────────────────────────────────────────────────────────────────

export function runTrials(config: SystemConfig, trials: number, seed: number): TrialsResult {
  // ONE continuous RNG stream across all trials — never reseed per trial.
  const rng = mulberry32(seed)

  const { maxRounds } = config
  const finals: number[] = []
  let ruinCount = 0
  let targetCount = 0

  // Collect per-round bankroll arrays (padded to maxRounds) for band computation.
  const allCurves: number[][] = []

  for (let t = 0; t < trials; t++) {
    const result = simulateSession(config, rng)
    finals.push(result.finalBankrollCents)
    if (result.ruined) ruinCount++
    if (result.hitTarget) targetCount++

    // Pad the curve to maxRounds by repeating the last value.
    const curve = result.curve.slice()
    const last = curve.length > 0 ? curve[curve.length - 1]! : config.startBankrollCents
    while (curve.length < maxRounds) curve.push(last)
    allCurves.push(curve)
  }

  // Compute mean.
  const mean = finals.reduce((a, b) => a + b, 0) / trials

  // Compute median.
  const sortedFinals = finals.slice().sort((a, b) => a - b)
  const median = percentile(sortedFinals, 50)

  // Compute bands: for each round index, collect values from all trials and compute percentiles.
  const p10: number[] = new Array(maxRounds).fill(0)
  const p25: number[] = new Array(maxRounds).fill(0)
  const p50: number[] = new Array(maxRounds).fill(0)
  const p75: number[] = new Array(maxRounds).fill(0)
  const p90: number[] = new Array(maxRounds).fill(0)

  for (let r = 0; r < maxRounds; r++) {
    const vals: number[] = []
    for (let t = 0; t < trials; t++) {
      vals.push(allCurves[t]![r]!)
    }
    vals.sort((a, b) => a - b)
    p10[r] = percentile(vals, 10)
    p25[r] = percentile(vals, 25)
    p50[r] = percentile(vals, 50)
    p75[r] = percentile(vals, 75)
    p90[r] = percentile(vals, 90)
  }

  return {
    trials,
    ruinRate: ruinCount / trials,
    targetRate: targetCount / trials,
    medianFinalCents: median,
    meanFinalCents: mean,
    finals,
    bands: { p10, p25, p50, p75, p90 }
  }
}
