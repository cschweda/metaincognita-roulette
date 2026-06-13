import { type Pocket } from './wheel'
import { type Rng, mulberry32 } from './prng'
import { type Bet, type Rules, settleBet } from './bets'
import { simulateSpin, type WheelCondition } from './physics'

export type Phase = 'betting' | 'spun' | 'settled'

export interface RoundEvent {
  type: 'no-more-bets' | 'ball-settled' | 'settled'
  pocket?: Pocket
}

export interface PerBetResult {
  bet: Bet
  won: boolean
  returnCents: number
}

export interface RoundResult {
  pocket: Pocket
  perBet: PerBetResult[]
  totalStakeCents: number
  totalReturnCents: number
  netCents: number
  events: RoundEvent[]
}

// One continuous seeded stream per game session (live: crypto-seeded; tests: fixed).
// Re-seeding per spin (the prototype bug) must never recur.
export class RouletteGame {
  private rng: Rng
  constructor(private rules: Rules, seed: number, private cond: WheelCondition = {}) {
    this.rng = mulberry32(seed)
  }

  playRound(bets: Bet[]): RoundResult {
    const events: RoundEvent[] = [{ type: 'no-more-bets' }]
    const { pocket } = simulateSpin(this.rng, this.rules.variant, this.cond)
    events.push({ type: 'ball-settled', pocket })

    const perBet: PerBetResult[] = bets.map((bet) => {
      const s = settleBet(bet, pocket, this.rules)
      return { bet, won: s.won, returnCents: s.returnCents }
    })
    const totalStakeCents = bets.reduce((a, b) => a + b.stakeCents, 0)
    const totalReturnCents = perBet.reduce((a, p) => a + p.returnCents, 0)
    events.push({ type: 'settled', pocket })

    return {
      pocket,
      perBet,
      totalStakeCents,
      totalReturnCents,
      netCents: totalReturnCents - totalStakeCents,
      events,
    }
  }
}
