import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRouletteStore } from '../../app/stores/roulette'

const init = (bankrollCents: number, selectedChipCents: number) => {
  const store = useRouletteStore()
  store.initializeGame({ presetId: 'american', playerName: 'T', bankrollCents, selectedChipCents })
  return store
}

describe('you can never stake more than your bankroll', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('rejects a stake larger than the bankroll and deducts nothing', () => {
    const store = init(1100, 100) // $11 bankroll
    expect(store.placeBet({ type: 'red', numbers: [] }, 50_000)).toBe(false) // $500 bet
    expect(store.bankrollCents).toBe(1100)
    expect(store.totalStakedCents).toBe(0)
  })

  it('allows a stake up to exactly the bankroll', () => {
    const store = init(1100, 100)
    expect(store.placeBet({ type: 'red', numbers: [] }, 1100)).toBe(true) // all-in $11
    expect(store.bankrollCents).toBe(0)
    expect(store.totalStakedCents).toBe(1100)
  })

  it('clamps the selected chip down as the bankroll falls', () => {
    const store = init(1100, 500) // $11 bankroll, $5 chip selected
    expect(store.placeBet({ type: 'red', numbers: [] }, 500)).toBe(true) // $6 left
    expect(store.placeBet({ type: 'red', numbers: [] }, 500)).toBe(true) // merges -> $1 left
    expect(store.bankrollCents).toBe(100)
    expect(store.selectedChipCents).toBe(100) // fell from $5 to the largest affordable, $1
  })

  it('drops the selected chip to 0 when broke', () => {
    const store = init(500, 500) // $5 bankroll, $5 chip
    store.placeBet({ type: 'red', numbers: [] }, 500) // all-in -> $0
    expect(store.bankrollCents).toBe(0)
    expect(store.selectedChipCents).toBe(0)
  })

  it('rebuy adds chips back and re-enables a selectable chip', () => {
    const store = init(500, 500) // $5 bankroll, $5 chip
    store.placeBet({ type: 'red', numbers: [] }, 500) // all-in -> $0
    expect(store.selectedChipCents).toBe(0)
    store.rebuy(20_000)
    expect(store.bankrollCents).toBe(20_000)
    expect(store.selectedChipCents).toBeGreaterThan(0)
  })

  it('setSelectedChip refuses a denomination above the bankroll', () => {
    const store = init(1100, 100)
    store.setSelectedChip(50_000) // $500 > $11
    expect(store.selectedChipCents).toBe(100)
  })

  it('clearBets returns the stake to the bankroll', () => {
    const store = init(10_000, 500)
    store.placeBet({ type: 'red', numbers: [] }, 500)
    expect(store.bankrollCents).toBe(9_500)
    store.clearBets()
    expect(store.bankrollCents).toBe(10_000)
  })

  it('showFlash sets a transient message that auto-clears after 3s', () => {
    vi.useFakeTimers()
    const store = init(10_000, 100)
    store.showFlash('Place a bet before spinning.')
    expect(store.flash?.text).toBe('Place a bet before spinning.')
    expect(store.flash?.tone).toBe('error')
    vi.advanceTimersByTime(3000)
    expect(store.flash).toBeNull()
    vi.useRealTimers()
  })

  it('repeatLastBet refuses when the prior round costs more than the bankroll', () => {
    const store = init(10_000, 500)
    store.placeBet({ type: 'red', numbers: [] }, 10_000) // all-in $100
    store.lastRoundBets = [...store.bets]
    store.bets = [] // new round, table cleared
    store.bankrollCents = 100 // only $1 won back
    expect(store.repeatLastBet()).toBe(false)
    expect(store.totalStakedCents).toBe(0) // nothing new placed
  })
})
