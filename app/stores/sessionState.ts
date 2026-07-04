import type { Variant, Pocket } from '../engine/wheel'
import { PAYOUTS, type EvenMoneyRule, type Bet } from '../engine/bets'
import type { WheelCondition } from '../engine/physics'

export const SESSION_VERSION = 1 as const

export type SpinSpeed = 'realistic' | 'quick'

export interface SpinRecord { pocket: Pocket, netCents: number }
export interface SessionStats {
  spins: number
  wageredCents: number
  netCents: number
  // Durable W–L counters: spinHistory truncates at 50 entries, so a record
  // derived from it drifts on long sessions.
  wins: number
  losses: number
}

export interface SpinLogEntry {
  /** null for non-spin events (rebuy). */
  pocket: Pocket | null
  stakeCents: number
  returnCents: number
  netCents: number
  bankrollCents: number
  /** Absent on legacy entries — treat as 'spin'. */
  event?: 'spin' | 'rebuy'
}

export interface RouletteSession {
  version: typeof SESSION_VERSION
  presetId: string
  variant: Variant
  evenMoney: EvenMoneyRule
  playerName: string
  bankrollCents: number
  selectedChipCents: number
  bets: Bet[]
  spinHistory: SpinRecord[]
  sessionStats: SessionStats
  bankrollHistory: number[]
  wheelCondition: WheelCondition
  sessionLog: SpinLogEntry[]
  spinSpeed: SpinSpeed
}

export function serializeSession(s: RouletteSession): string {
  return JSON.stringify(s)
}

const BET_TYPES: ReadonlySet<string> = new Set(Object.keys(PAYOUTS))

function isPocketValue(v: unknown): v is Pocket {
  return v === '00' || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 36)
}

function isValidBet(v: unknown): v is Bet {
  if (typeof v !== 'object' || v === null) return false
  const b = v as Record<string, unknown>
  return typeof b.type === 'string' && BET_TYPES.has(b.type)
    && Array.isArray(b.numbers) && b.numbers.every(isPocketValue)
    && typeof b.stakeCents === 'number' && Number.isFinite(b.stakeCents) && b.stakeCents > 0
}

/** Parse + validate + sanitize. Returns null on corrupt/foreign/wrong-version data. */
export function parseSession(raw: string): RouletteSession | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.version !== SESSION_VERSION) return null
  if (typeof d.presetId !== 'string' || typeof d.playerName !== 'string') return null
  if (typeof d.bankrollCents !== 'number' || !Number.isFinite(d.bankrollCents) || d.bankrollCents < 0) return null
  if (!Array.isArray(d.bets) || !Array.isArray(d.spinHistory)) return null
  if (!d.bets.every(isValidBet)) return null
  if (typeof d.variant !== 'string' || typeof d.evenMoney !== 'string') return null
  if (typeof d.selectedChipCents !== 'number') return null
  if (typeof d.sessionStats !== 'object' || d.sessionStats === null) return null
  const session = data as RouletteSession
  if (!Array.isArray(session.bankrollHistory)) session.bankrollHistory = []
  if (typeof session.wheelCondition !== 'object' || session.wheelCondition === null) session.wheelCondition = {}
  if (!Array.isArray(session.sessionLog)) session.sessionLog = []
  if (session.spinSpeed !== 'quick') session.spinSpeed = 'realistic'
  // Back-compat: sessions saved before W–L counters existed derive them from
  // the spin log (rebuy rows are not spins).
  const stats = session.sessionStats as Partial<SessionStats>
  if (typeof stats.wins !== 'number' || !Number.isFinite(stats.wins)
    || typeof stats.losses !== 'number' || !Number.isFinite(stats.losses)) {
    const spins = session.sessionLog.filter(e => (e.event ?? 'spin') === 'spin' && typeof e.netCents === 'number')
    stats.wins = spins.filter(e => e.netCents > 0).length
    stats.losses = spins.filter(e => e.netCents < 0).length
  }
  return session
}
