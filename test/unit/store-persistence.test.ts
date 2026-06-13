import { describe, it, expect } from 'vitest'
import { serializeSession, parseSession, type RouletteSession } from '../../app/stores/sessionState'

const sample: RouletteSession = {
  version: 1,
  presetId: 'european',
  variant: 'single',
  evenMoney: 'none',
  playerName: 'Ada',
  bankrollCents: 100_000,
  selectedChipCents: 500,
  bets: [],
  spinHistory: [],
  sessionStats: { spins: 0, wageredCents: 0, netCents: 0 },
}

describe('session persistence (versioned)', () => {
  it('round-trips a valid session', () => {
    const restored = parseSession(serializeSession(sample))
    expect(restored).toEqual(sample)
  })
  it('rejects a wrong-version blob', () => {
    expect(parseSession(JSON.stringify({ ...sample, version: 99 }))).toBeNull()
  })
  it('rejects corrupt JSON', () => {
    expect(parseSession('{not json')).toBeNull()
  })
  it('rejects a structurally-invalid blob', () => {
    expect(parseSession(JSON.stringify({ version: 1 }))).toBeNull()
  })
})
