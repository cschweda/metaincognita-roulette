import { PAYOUTS, coverage, type Bet } from '../engine/bets'
import { pocketCount, type Variant } from '../engine/wheel'
import { formatCents } from './format'

/** A short, human-readable name for a bet, e.g. "Red", "Straight 7", "Corner 7–11", "1st 12". */
export function betLabel(bet: Bet): string {
  const n = bet.numbers
  switch (bet.type) {
    case 'red': return 'Red'
    case 'black': return 'Black'
    case 'odd': return 'Odd'
    case 'even': return 'Even'
    case 'low': return '1–18'
    case 'high': return '19–36'
    case 'straight': return `Straight ${n[0]}`
    case 'split': return `Split ${n.join('/')}`
    case 'street': return `Street ${n[0]}–${n[n.length - 1]}`
    case 'corner': return `Corner ${n[0]}–${n[n.length - 1]}`
    case 'sixline': return `Six line ${n[0]}–${n[n.length - 1]}`
    case 'firstFive': return 'First Five'
    case 'dozen': return n[0] === 1 ? '1st 12' : n[0] === 13 ? '2nd 12' : '3rd 12'
    case 'column': return n[0] === 1 ? 'Column 1' : n[0] === 2 ? 'Column 2' : 'Column 3'
    default: return bet.type
  }
}

/**
 * A beginner-friendly, plain-language explanation of a bet, e.g.
 * "Black — pays 1:1, wins $5 if it hits (18 of 38)" or
 * "Straight 7 — pays 35:1, wins $175 if it hits (1 of 38)".
 */
export function betMeaning(bet: Bet, variant: Variant): string {
  const payout = PAYOUTS[bet.type]
  const wins = formatCents(bet.stakeCents * payout)
  const hits = coverage(bet).size
  const total = pocketCount(variant)
  return `${betLabel(bet)} — pays ${payout}:1, wins ${wins} if it hits (${hits} of ${total})`
}
