import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRouletteStore } from '../../app/stores/roulette'

beforeEach(() => setActivePinia(createPinia()))

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
