import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRouletteStore } from '../../app/stores/roulette'
import type { RoundResult } from '../../app/engine/round'

beforeEach(() => setActivePinia(createPinia()))

const roundOf = (netCents: number): RoundResult => ({
  pocket: 7,
  perBet: [],
  totalStakeCents: 100,
  totalReturnCents: 100 + netCents,
  netCents,
  events: []
})

describe('store spin actions', () => {
  it('computeSpin returns an engine pocket without revealing; commitSpin records it', () => {
    const store = useRouletteStore()
    store.initializeGame({ presetId: 'european', playerName: 'Ada', bankrollCents: 100_000, selectedChipCents: 500 }, 123)
    expect(store.phase).toBe('betting')

    const result = store.computeSpin()
    expect(store.phase).toBe('spinning')
    expect(store.spinHistory.length).toBe(0)
    expect(result.pocket === 0 || typeof result.pocket === 'number' || result.pocket === '00').toBe(true)

    store.commitSpin(result)
    expect(store.phase).toBe('resolved')
    expect(store.spinHistory.length).toBe(1)
    expect(store.spinHistory[0]!.pocket).toBe(result.pocket)
    expect(store.sessionStats.spins).toBe(1)
  })

  it('counts wins and losses in sessionStats — pushes count as neither', () => {
    // spinHistory truncates at 50 entries, so a W–L record derived from it
    // drifts on long sessions; the durable counters live in sessionStats.
    const store = useRouletteStore()
    store.initializeGame({ presetId: 'european', playerName: 'Ada', bankrollCents: 100_000, selectedChipCents: 500 }, 123)
    store.commitSpin(roundOf(500))
    store.commitSpin(roundOf(-500))
    store.commitSpin(roundOf(-500))
    store.commitSpin(roundOf(0))
    expect(store.sessionStats.spins).toBe(4)
    expect(store.sessionStats.wins).toBe(1)
    expect(store.sessionStats.losses).toBe(2)
  })

  it('logs a rebuy into the session log so the CSV bankroll column reconciles', () => {
    const store = useRouletteStore()
    store.initializeGame({ presetId: 'european', playerName: 'Ada', bankrollCents: 1_000, selectedChipCents: 500 }, 123)
    store.rebuy(2_000)
    expect(store.sessionLog.length).toBe(1)
    expect(store.sessionLog[0]).toMatchObject({
      event: 'rebuy',
      pocket: null,
      stakeCents: 0,
      returnCents: 2_000,
      netCents: 0,
      bankrollCents: 3_000
    })
  })

  it('is deterministic for a fixed seed', () => {
    const a = useRouletteStore()
    a.initializeGame({ presetId: 'european', playerName: 'A', bankrollCents: 100_000, selectedChipCents: 500 }, 999)
    const r1 = a.computeSpin()
    setActivePinia(createPinia())
    const b = useRouletteStore()
    b.initializeGame({ presetId: 'european', playerName: 'B', bankrollCents: 100_000, selectedChipCents: 500 }, 999)
    const r2 = b.computeSpin()
    expect(r2.pocket).toBe(r1.pocket)
  })
})
