import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRouletteStore } from '../../app/stores/roulette'
import { simulateSpin } from '../../app/engine/physics'
import { mulberry32 } from '../../app/engine/prng'

beforeEach(() => setActivePinia(createPinia()))

function freshStore(seed: number) {
  const s = useRouletteStore()
  s.initializeGame({ presetId: 'european', playerName: 'Ada', bankrollCents: 100_000, selectedChipCents: 500 }, seed)
  return s
}

describe('store betting', () => {
  it('placeBet deducts immediately and merges chips on the same zone', () => {
    const s = freshStore(1)
    expect(s.placeBet({ type: 'red', numbers: [] }, 500)).toBe(true)
    expect(s.bankrollCents).toBe(99_500)
    s.placeBet({ type: 'red', numbers: [] }, 500)
    expect(s.bankrollCents).toBe(99_000)
    expect(s.bets.length).toBe(1)
    expect(s.bets[0]!.stakeCents).toBe(1000)
    expect(s.totalStakedCents).toBe(1000)
  })
  it('rejects a bet larger than the bankroll', () => {
    const s = freshStore(1)
    expect(s.placeBet({ type: 'straight', numbers: [7] }, 200_000)).toBe(false)
    expect(s.bankrollCents).toBe(100_000)
    expect(s.bets.length).toBe(0)
  })
  it('clearBets refunds all stakes', () => {
    const s = freshStore(1)
    s.placeBet({ type: 'straight', numbers: [7] }, 500)
    s.placeBet({ type: 'black', numbers: [] }, 1000)
    s.clearBets()
    expect(s.bankrollCents).toBe(100_000)
    expect(s.bets.length).toBe(0)
  })
  it('settles a winning straight: returns stake + 35x; history/stats update; bets cleared', () => {
    let seed = 0
    while (simulateSpin(mulberry32(seed), 'single').pocket !== 7) seed++
    const s = freshStore(seed)
    s.placeBet({ type: 'straight', numbers: [7] }, 500)
    const result = s.computeSpin()
    expect(result.pocket).toBe(7)
    s.commitSpin(result)
    expect(s.bankrollCents).toBe(117_500) // 99_500 + (500 + 17_500)
    expect(s.spinHistory[0]!.pocket).toBe(7)
    expect(s.sessionStats.spins).toBe(1)
    expect(s.sessionStats.wageredCents).toBe(500)
    expect(s.bets.length).toBe(0)
    expect(s.lastRoundBets.length).toBe(1)
  })
})
