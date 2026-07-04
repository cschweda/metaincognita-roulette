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
  sessionStats: { spins: 0, wageredCents: 0, netCents: 0, wins: 0, losses: 0 },
  bankrollHistory: [],
  wheelCondition: {},
  sessionLog: [],
  spinSpeed: 'realistic'
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
  it('defaults bankrollHistory to [] when missing (back-compat)', () => {
    const { bankrollHistory, ...withoutBH } = sample
    const restored = parseSession(JSON.stringify(withoutBH))
    expect(restored).not.toBeNull()
    expect(restored!.bankrollHistory).toEqual([])
  })
  it('rejects a negative or non-finite bankroll', () => {
    expect(parseSession(JSON.stringify({ ...sample, bankrollCents: -100 }))).toBeNull()
    expect(parseSession(JSON.stringify({ ...sample, bankrollCents: Number.NaN }))).toBeNull()
  })
  it('rejects malformed bets — unknown type, bad stake, or bogus pockets', () => {
    const withBets = (bets: unknown) => JSON.stringify({ ...sample, bets })
    expect(parseSession(withBets([{ type: 'lucky7', numbers: [], stakeCents: 100 }]))).toBeNull()
    expect(parseSession(withBets([{ type: 'red', numbers: [], stakeCents: Number.NaN }]))).toBeNull()
    expect(parseSession(withBets([{ type: 'red', numbers: [], stakeCents: -500 }]))).toBeNull()
    expect(parseSession(withBets([{ type: 'straight', numbers: [99], stakeCents: 100 }]))).toBeNull()
    expect(parseSession(withBets(['not a bet']))).toBeNull()
    // …while a well-formed bet still parses.
    const ok = parseSession(withBets([{ type: 'split', numbers: [7, 8], stakeCents: 500 }]))
    expect(ok).not.toBeNull()
    expect(ok!.bets.length).toBe(1)
  })
  it('derives missing win/loss counters from the session log (back-compat), ignoring rebuys', () => {
    const legacy = {
      ...sample,
      sessionStats: { spins: 3, wageredCents: 300, netCents: -100 },
      sessionLog: [
        { pocket: 7, stakeCents: 100, returnCents: 200, netCents: 100, bankrollCents: 1_100 },
        { pocket: 12, stakeCents: 100, returnCents: 0, netCents: -100, bankrollCents: 1_000 },
        { event: 'rebuy', pocket: null, stakeCents: 0, returnCents: 2_000, netCents: 0, bankrollCents: 3_000 },
        { pocket: 0, stakeCents: 100, returnCents: 0, netCents: -100, bankrollCents: 2_900 }
      ]
    }
    const restored = parseSession(JSON.stringify(legacy))
    expect(restored).not.toBeNull()
    expect(restored!.sessionStats.wins).toBe(1)
    expect(restored!.sessionStats.losses).toBe(2)
  })
})
