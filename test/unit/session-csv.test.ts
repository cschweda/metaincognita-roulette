import { describe, it, expect } from 'vitest'
import type { SpinLogEntry } from '../../app/stores/sessionState'
import { sessionToCsv } from '../../app/utils/sessionCsv'

const sampleEntry: SpinLogEntry = {
  pocket: 7,
  stakeCents: 500,
  returnCents: 18_000,
  netCents: 17_500,
  bankrollCents: 117_500
}

describe('sessionToCsv', () => {
  it('produces the correct header row (with the event column)', () => {
    const csv = sessionToCsv([sampleEntry])
    const firstLine = csv.split('\n')[0]
    expect(firstLine).toBe('spin,event,number,color,staked_cents,returned_cents,net_cents,bankroll_cents')
  })

  it('row count equals the log length', () => {
    const log: SpinLogEntry[] = [sampleEntry, { ...sampleEntry, pocket: 14, netCents: -500, bankrollCents: 99_500 }]
    const csv = sessionToCsv(log)
    const lines = csv.trim().split('\n')
    // header + data rows
    expect(lines.length).toBe(log.length + 1)
  })

  it('sample row contains the correct number, color, and net — legacy entries default to event "spin"', () => {
    const csv = sessionToCsv([sampleEntry])
    expect(csv).toContain('1,spin,7,red,500,18000,17500,117500')
  })

  it('renders a rebuy row with an empty number/color and the amount as returned', () => {
    const rebuy: SpinLogEntry = {
      event: 'rebuy',
      pocket: null,
      stakeCents: 0,
      returnCents: 20_000,
      netCents: 0,
      bankrollCents: 20_000
    }
    const csv = sessionToCsv([sampleEntry, rebuy])
    expect(csv).toContain('2,rebuy,,,0,20000,0,20000')
  })

  it('returns empty (header-only) for an empty log', () => {
    const csv = sessionToCsv([])
    const lines = csv.trim().split('\n')
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('spin')
  })

  it('assigns color "green" to pocket 0', () => {
    const entry: SpinLogEntry = { pocket: 0, stakeCents: 100, returnCents: 0, netCents: -100, bankrollCents: 9_900 }
    expect(sessionToCsv([entry])).toContain(',0,green,')
  })
})
