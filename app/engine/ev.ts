// app/engine/ev.ts
import { WHEEL_ORDER } from './wheel'
import { settleBet, type Bet, type Rules } from './bets'

/**
 * Exact expected net result of a bet in cents (negative = house edge).
 * Computed by averaging the net outcome over every pocket in the wheel —
 * valid because the wheel is uniform. All rule logic (La Partage, Surrender,
 * First Five, etc.) is delegated to settleBet with no duplication.
 */
export function exactEvCents(bet: Bet, rules: Rules): number {
  const order = WHEEL_ORDER[rules.variant]
  let grossReturn = 0
  for (const pocket of order) {
    grossReturn += settleBet(bet, pocket, rules).returnCents
  }
  return grossReturn / order.length - bet.stakeCents
}

/**
 * House edge for a bet as a percentage (positive = house advantage, e.g. 2.70).
 * Returns 0 for a zero-stake bet to avoid division by zero.
 */
export function edgePct(bet: Bet, rules: Rules): number {
  if (bet.stakeCents === 0) return 0
  return (-exactEvCents(bet, rules) / bet.stakeCents) * 100
}

/**
 * Combined expected net (cents) of several simultaneous bets.
 * EV is additive, so this is the sum of individual EVs.
 */
export function combinedEvCents(bets: Bet[], rules: Rules): number {
  return bets.reduce((sum, b) => sum + exactEvCents(b, rules), 0)
}
