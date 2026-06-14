import type { SpinLogEntry } from '~/stores/sessionState'
import { colorOf } from '~/engine/wheel'

export function sessionToCsv(log: SpinLogEntry[]): string {
  const header = ['spin', 'number', 'color', 'staked_cents', 'returned_cents', 'net_cents', 'bankroll_cents']
  const rows = log.map((e, i) =>
    [i + 1, e.pocket, colorOf(e.pocket), e.stakeCents, e.returnCents, e.netCents, e.bankrollCents].join(',')
  )
  return [header.join(','), ...rows].join('\n') + '\n'
}
