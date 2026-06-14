import type { Bet } from '~/engine/bets'

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
