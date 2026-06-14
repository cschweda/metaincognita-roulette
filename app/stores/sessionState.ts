import type { Variant, Pocket } from '../engine/wheel'
import type { EvenMoneyRule, Bet } from '../engine/bets'
import type { WheelCondition } from '../engine/physics'

export const SESSION_VERSION = 1 as const

export type SpinSpeed = 'realistic' | 'quick'

export interface SpinRecord { pocket: Pocket, netCents: number }
export interface SessionStats { spins: number, wageredCents: number, netCents: number }

export interface SpinLogEntry {
  pocket: Pocket
  stakeCents: number
  returnCents: number
  netCents: number
  bankrollCents: number
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
  if (typeof d.bankrollCents !== 'number' || !Number.isFinite(d.bankrollCents)) return null
  if (!Array.isArray(d.bets) || !Array.isArray(d.spinHistory)) return null
  if (typeof d.variant !== 'string' || typeof d.evenMoney !== 'string') return null
  if (typeof d.selectedChipCents !== 'number') return null
  if (typeof d.sessionStats !== 'object' || d.sessionStats === null) return null
  const session = data as RouletteSession
  if (!Array.isArray(session.bankrollHistory)) session.bankrollHistory = []
  if (typeof session.wheelCondition !== 'object' || session.wheelCondition === null) session.wheelCondition = {}
  if (!Array.isArray(session.sessionLog)) session.sessionLog = []
  if (session.spinSpeed !== 'quick') session.spinSpeed = 'realistic'
  return session
}
