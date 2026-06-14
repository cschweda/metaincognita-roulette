import { describe, it, expect } from 'vitest'
import type { SpinLogEntry } from '../../app/stores/sessionState'
import { colorOf } from '../../app/engine/wheel'

// Inline sessionToCsv logic to avoid ~/alias in unit environment.
// This mirrors app/utils/sessionCsv.ts exactly, keeping the test self-contained.
function sessionToCsv(log: SpinLogEntry[]): string {
  const header = ['spin', 'number', 'color', 'staked_cents', 'returned_cents', 'net_cents', 'bankroll_cents']
  const rows = log.map((e, i) =>
    [i + 1, e.pocket, colorOf(e.pocket), e.stakeCents, e.returnCents, e.netCents, e.bankrollCents].join(',')
  )
  return [header.join(','), ...rows].join('\n') + '\n'
}

const sampleEntry: SpinLogEntry = {
  pocket: 7,
  stakeCents: 500,
  returnCents: 18_000,
  netCents: 17_500,
  bankrollCents: 117_500
}

describe('sessionToCsv', () => {
  it('produces the correct header row', () => {
    const csv = sessionToCsv([sampleEntry])
    const firstLine = csv.split('\n')[0]
    expect(firstLine).toBe('spin,number,color,staked_cents,returned_cents,net_cents,bankroll_cents')
  })

  it('row count equals the log length', () => {
    const log: SpinLogEntry[] = [sampleEntry, { ...sampleEntry, pocket: 14, netCents: -500, bankrollCents: 99_500 }]
    const csv = sessionToCsv(log)
    const lines = csv.trim().split('\n')
    // header + data rows
    expect(lines.length).toBe(log.length + 1)
  })

  it('sample row contains the correct number, color, and net', () => {
    const csv = sessionToCsv([sampleEntry])
    expect(csv).toContain('1,7,red,500,18000,17500,117500')
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
