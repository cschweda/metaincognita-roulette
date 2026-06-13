import { defineStore } from 'pinia'
import { rouletteConfig } from '../../roulette.config'
import type { Variant } from '../engine/wheel'
import type { EvenMoneyRule, Bet } from '../engine/bets'
import {
  SESSION_VERSION, serializeSession, parseSession,
  type RouletteSession, type SpinRecord, type SessionStats,
} from './sessionState'

export type Phase = 'setup' | 'betting' | 'spinning' | 'resolved'

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
    storageWarning: false,
  }),
  getters: {
    preset: (s) => rouletteConfig.presets.find((p) => p.id === s.presetId) ?? rouletteConfig.presets[0]!,
  },
  actions: {
    initializeGame(args: InitArgs) {
      const preset = rouletteConfig.presets.find((p) => p.id === args.presetId) ?? rouletteConfig.presets[0]!
      this.presetId = preset.id
      this.variant = preset.variant
      this.evenMoney = preset.evenMoney
      this.playerName = args.playerName
      this.bankrollCents = args.bankrollCents
      this.selectedChipCents = args.selectedChipCents
      this.bets = []
      this.spinHistory = []
      this.sessionStats = { spins: 0, wageredCents: 0, netCents: 0 }
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
      if (!session) { localStorage.removeItem(rouletteConfig.storage.sessionKey); return false }
      this.presetId = session.presetId
      this.variant = session.variant
      this.evenMoney = session.evenMoney
      this.playerName = session.playerName
      this.bankrollCents = session.bankrollCents
      this.selectedChipCents = session.selectedChipCents
      this.bets = session.bets
      this.spinHistory = session.spinHistory
      this.sessionStats = session.sessionStats
      this.phase = 'betting'
      return true
    },
    clearSession() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(rouletteConfig.storage.sessionKey)
      this.$reset()
    },
  },
})
