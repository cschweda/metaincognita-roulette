import type { Variant } from './app/engine/wheel'
import type { EvenMoneyRule } from './app/engine/bets'
import { PAYOUTS } from './app/engine/bets'

export interface RulePreset {
  id: string
  label: string
  variant: Variant
  evenMoney: EvenMoneyRule
  /** Theoretical house edge on most bets, for display (model figure). */
  edgePct: number
  blurb: string
}

export interface StakeTier {
  id: string
  label: string
  minBetCents: number
  maxBetCents: number
  defaultBankrollCents: number
}

export const rouletteConfig = {
  storage: {
    sessionKey: 'roulette-session-v1',
    statsKey: 'roulette-training-v1',
  },
  /** Pay table mirrors app/engine/bets.ts (single source of truth). */
  payouts: { ...PAYOUTS },
  presets: [
    { id: 'european', label: 'European (single zero)', variant: 'single', evenMoney: 'none', edgePct: 2.7, blurb: '37 pockets. 2.70% edge on every bet.' },
    { id: 'european-partage', label: 'European + La Partage', variant: 'single', evenMoney: 'la_partage', edgePct: 1.35, blurb: 'Recover half an even-money bet when zero hits — 1.35% edge.' },
    { id: 'american', label: 'American (double zero)', variant: 'double', evenMoney: 'none', edgePct: 5.26, blurb: '38 pockets. 5.26% edge; the First Five is worse (7.89%).' },
    { id: 'american-surrender', label: 'American + Surrender', variant: 'double', evenMoney: 'surrender', edgePct: 2.63, blurb: 'Half an even-money bet back on 0/00 — 2.63% edge.' },
  ] satisfies RulePreset[],
  stakes: [
    { id: 'low', label: 'Low', minBetCents: 100, maxBetCents: 50_000, defaultBankrollCents: 20_000 },
    { id: 'mid', label: 'Mid', minBetCents: 500, maxBetCents: 500_000, defaultBankrollCents: 100_000 },
    { id: 'high', label: 'High', minBetCents: 2_500, maxBetCents: 5_000_000, defaultBankrollCents: 1_000_000 },
  ] satisfies StakeTier[],
  /** Chip denominations offered in the tray (cents). */
  chips: [100, 500, 2_500, 10_000, 50_000],
  timings: { spinMs: 8800, settleRevealMs: 600 },
  defaultPresetId: 'european',
} as const
