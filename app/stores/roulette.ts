import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { rouletteConfig } from '../../roulette.config'
import type { Variant, Pocket } from '../engine/wheel'
import type { BetType, EvenMoneyRule, Bet } from '../engine/bets'
import { RouletteGame, type RoundResult } from '../engine/round'
import {
  SESSION_VERSION, serializeSession, parseSession,
  type RouletteSession, type SpinRecord, type SessionStats
} from './sessionState'

export type Phase = 'setup' | 'betting' | 'spinning' | 'resolved'

function sameNumbers(a: Pocket[], b: Pocket[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].map(String).sort()
  const sb = [...b].map(String).sort()
  return sa.every((v, i) => v === sb[i])
}

function cryptoSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0]!
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

interface InitArgs {
  presetId: string
  playerName: string
  bankrollCents: number
  selectedChipCents: number
}

export const useRouletteStore = defineStore('roulette', {
  state: () => ({
    phase: 'setup' as Phase,
    presetId: rouletteConfig.defaultPresetId as string,
    variant: 'single' as Variant,
    evenMoney: 'none' as EvenMoneyRule,
    playerName: '',
    bankrollCents: 0,
    selectedChipCents: rouletteConfig.chips[0] as number,
    bets: [] as Bet[],
    spinHistory: [] as SpinRecord[],
    sessionStats: { spins: 0, wageredCents: 0, netCents: 0 } as SessionStats,
    bankrollHistory: [] as number[],
    lastRoundBets: [] as Bet[],
    storageWarning: false,
    game: null as RouletteGame | null,
    revealPocket: null as Pocket | null
  }),
  getters: {
    preset: s => rouletteConfig.presets.find(p => p.id === s.presetId) ?? rouletteConfig.presets[0]!,
    totalStakedCents: s => s.bets.reduce((acc, b) => acc + b.stakeCents, 0)
  },
  actions: {
    initializeGame(args: InitArgs, seed?: number) {
      const preset = rouletteConfig.presets.find(p => p.id === args.presetId) ?? rouletteConfig.presets[0]!
      this.presetId = preset.id
      this.variant = preset.variant
      this.evenMoney = preset.evenMoney
      this.playerName = args.playerName
      this.bankrollCents = args.bankrollCents
      this.selectedChipCents = args.selectedChipCents
      this.bets = []
      this.spinHistory = []
      this.sessionStats = { spins: 0, wageredCents: 0, netCents: 0 }
      this.bankrollHistory = [args.bankrollCents]
      this.game = markRaw(new RouletteGame({ variant: preset.variant, evenMoney: preset.evenMoney }, seed ?? cryptoSeed()))
      this.revealPocket = null
      this.phase = 'betting'
      this.saveToLocalStorage()
    },
    snapshot(): RouletteSession {
      return {
        version: SESSION_VERSION,
        presetId: this.presetId,
        variant: this.variant,
        evenMoney: this.evenMoney,
        playerName: this.playerName,
        bankrollCents: this.bankrollCents,
        selectedChipCents: this.selectedChipCents,
        bets: this.bets,
        spinHistory: this.spinHistory,
        sessionStats: this.sessionStats,
        bankrollHistory: this.bankrollHistory
      }
    },
    saveToLocalStorage() {
      if (typeof localStorage === 'undefined') return
      try {
        localStorage.setItem(rouletteConfig.storage.sessionKey, serializeSession(this.snapshot()))
        this.storageWarning = false
      } catch {
        this.storageWarning = true
      }
    },
    loadFromLocalStorage(): boolean {
      if (typeof localStorage === 'undefined') return false
      const raw = localStorage.getItem(rouletteConfig.storage.sessionKey)
      if (!raw) return false
      const session = parseSession(raw)
      if (!session) {
        localStorage.removeItem(rouletteConfig.storage.sessionKey)
        return false
      }
      this.presetId = session.presetId
      this.variant = session.variant
      this.evenMoney = session.evenMoney
      this.playerName = session.playerName
      this.bankrollCents = session.bankrollCents
      this.selectedChipCents = session.selectedChipCents
      this.bets = session.bets
      this.spinHistory = session.spinHistory
      this.sessionStats = session.sessionStats
      this.bankrollHistory = session.bankrollHistory
      this.game = markRaw(new RouletteGame({ variant: this.variant, evenMoney: this.evenMoney }, cryptoSeed()))
      this.phase = 'betting'
      return true
    },
    clearSession() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(rouletteConfig.storage.sessionKey)
      this.$reset()
    },
    computeSpin(): RoundResult {
      if (!this.game) throw new Error('no game in progress')
      this.phase = 'spinning'
      this.revealPocket = null
      return this.game.playRound(this.bets)
    },
    commitSpin(result: RoundResult) {
      this.bankrollCents += result.totalReturnCents
      this.bankrollHistory.push(this.bankrollCents)
      this.bankrollHistory = this.bankrollHistory.slice(-60)
      this.spinHistory.unshift({ pocket: result.pocket, netCents: result.netCents })
      this.spinHistory = this.spinHistory.slice(0, 50)
      this.sessionStats.spins += 1
      this.sessionStats.wageredCents += result.totalStakeCents
      this.sessionStats.netCents += result.netCents
      this.revealPocket = result.pocket
      this.lastRoundBets = this.bets
      this.bets = []
      this.phase = 'resolved'
      this.saveToLocalStorage()
    },
    placeBet(descriptor: { type: BetType, numbers: Pocket[] }, stakeCents: number): boolean {
      if (this.phase === 'resolved') {
        this.bets = []
        this.phase = 'betting'
      }
      if (this.phase !== 'betting') return false
      if (stakeCents <= 0 || stakeCents > this.bankrollCents) return false
      const existing = this.bets.find(b => b.type === descriptor.type && sameNumbers(b.numbers, descriptor.numbers))
      if (existing) existing.stakeCents += stakeCents
      else this.bets.push({ type: descriptor.type, numbers: [...descriptor.numbers], stakeCents })
      this.bankrollCents -= stakeCents
      this.saveToLocalStorage()
      return true
    },
    clearBets() {
      for (const b of this.bets) this.bankrollCents += b.stakeCents
      this.bets = []
      this.saveToLocalStorage()
    },
    repeatLastBet(): boolean {
      if (this.lastRoundBets.length === 0) return false
      const total = this.lastRoundBets.reduce((acc, b) => acc + b.stakeCents, 0)
      if (total > this.bankrollCents) return false
      for (const b of this.lastRoundBets) this.placeBet({ type: b.type, numbers: b.numbers }, b.stakeCents)
      return true
    },
    setSelectedChip(cents: number) {
      this.selectedChipCents = cents
    },
    readyForNextSpin() {
      this.phase = 'betting'
    }
  }
})
