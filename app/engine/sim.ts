import { type Variant, pocketCount } from './wheel'
import { mulberry32 } from './prng'
import { simulateSpin, type WheelCondition } from './physics'
import { type Bet, type Rules, settleBet } from './bets'

// Tally landing-index frequencies over N seeded spins from one continuous stream.
export function runFrequencies(
  variant: Variant,
  spins: number,
  seed: number,
  cond: WheelCondition = {},
): number[] {
  const rng = mulberry32(seed)
  const counts = new Array<number>(pocketCount(variant)).fill(0)
  for (let i = 0; i < spins; i++) counts[simulateSpin(rng, variant, cond).index]++
  return counts
}

// Pearson χ² against a flat expectation. For a uniform wheel this ~ df (= pockets − 1).
export function chiSquare(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0)
  const expected = total / counts.length
  return counts.reduce((s, o) => s + ((o - expected) * (o - expected)) / expected, 0)
}

// Empirical house edge for a repeated single bet: (staked − returned) / staked.
export function measureEdge(
  variant: Variant,
  makeBet: () => Bet,
  rules: Rules,
  spins: number,
  seed: number,
): number {
  const rng = mulberry32(seed)
  let staked = 0
  let returned = 0
  for (let i = 0; i < spins; i++) {
    const { pocket } = simulateSpin(rng, variant, {})
    const bet = makeBet()
    staked += bet.stakeCents
    returned += settleBet(bet, pocket, rules).returnCents
  }
  return (staked - returned) / staked
}
