import type { SpinLogEntry } from '../stores/sessionState'
import { colorOf } from '../engine/wheel'

export function sessionToCsv(log: SpinLogEntry[]): string {
  const header = ['spin', 'event', 'number', 'color', 'staked_cents', 'returned_cents', 'net_cents', 'bankroll_cents']
  const rows = log.map((e, i) => {
    const event = e.event ?? 'spin' // entries predating the event column are spins
    const number = e.pocket === null ? '' : e.pocket
    const color = e.pocket === null ? '' : colorOf(e.pocket)
    return [i + 1, event, number, color, e.stakeCents, e.returnCents, e.netCents, e.bankrollCents].join(',')
  })
  return [header.join(','), ...rows].join('\n') + '\n'
}
