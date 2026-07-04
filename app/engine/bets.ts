import { type Pocket, type Variant, REDS } from './wheel'
import { winningsCents } from './money'

export type BetType
  = | 'straight' | 'split' | 'street' | 'corner' | 'firstFive' | 'sixline'
    | 'column' | 'dozen' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high'

// X in "X to 1" — identical across Arizona, Melbourne and Colorado pay tables.
export const PAYOUTS: Record<BetType, number> = {
  straight: 35, split: 17, street: 11, corner: 8, firstFive: 6, sixline: 5,
  column: 2, dozen: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1
}

export type EvenMoneyRule = 'none' | 'la_partage' | 'surrender' // En Prison: later plan (stateful)
export interface Rules { variant: Variant, evenMoney: EvenMoneyRule }

// Inside bets and column/dozen carry their explicit pockets in `numbers`.
// Outside even-money/range bets derive coverage from the type.
export interface Bet { type: BetType, numbers: Pocket[], stakeCents: number }

export interface Settlement { won: boolean, returnCents: number } // returnCents = stake + winnings, else 0 (or half-back)

const EVEN_MONEY: ReadonlySet<BetType> = new Set<BetType>(['red', 'black', 'odd', 'even', 'low', 'high'])

function range(a: number, b: number): number[] {
  const r: number[] = []
  for (let i = a; i <= b; i++) r.push(i)
  return r
}

export const COLUMNS: number[][] = [
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]
]
export const DOZENS: number[][] = [range(1, 12), range(13, 24), range(25, 36)]

function computeCoverage(bet: Bet): ReadonlySet<Pocket> {
  switch (bet.type) {
    case 'red': return new Set<Pocket>([...REDS])
    case 'black': return new Set<Pocket>(range(1, 36).filter(n => !REDS.has(n)))
    case 'odd': return new Set<Pocket>(range(1, 36).filter(n => n % 2 === 1))
    case 'even': return new Set<Pocket>(range(1, 36).filter(n => n % 2 === 0))
    case 'low': return new Set<Pocket>(range(1, 18))
    case 'high': return new Set<Pocket>(range(19, 36))
    default: return new Set<Pocket>(bet.numbers)
  }
}

// Memoized per type+numbers: settleBet runs once per simulated spin, and the
// million-spin proofs/sims would otherwise reallocate an 18-element Set each
// time. Returned sets are shared — treat them as immutable.
const coverageCache = new Map<string, ReadonlySet<Pocket>>()

export function coverage(bet: Bet): ReadonlySet<Pocket> {
  const key = bet.type + ':' + bet.numbers.join(',')
  let set = coverageCache.get(key)
  if (!set) {
    set = computeCoverage(bet)
    coverageCache.set(key, set)
  }
  return set
}

export function covers(bet: Bet, result: Pocket): boolean {
  return coverage(bet).has(result)
}

export function settleBet(bet: Bet, result: Pocket, rules: Rules): Settlement {
  if (covers(bet, result)) {
    return { won: true, returnCents: bet.stakeCents + winningsCents(bet.stakeCents, PAYOUTS[bet.type]) }
  }
  const isZero = result === 0 || result === '00'
  const halfBack = rules.evenMoney === 'la_partage' || rules.evenMoney === 'surrender'
  if (isZero && halfBack && EVEN_MONEY.has(bet.type)) {
    return { won: false, returnCents: Math.floor(bet.stakeCents / 2) }
  }
  return { won: false, returnCents: 0 }
}
