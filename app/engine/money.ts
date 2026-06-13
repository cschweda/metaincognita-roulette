// All wagers, payouts and bankrolls are integer cents — no floats (spec §6).

// Roulette payouts are all whole "X to 1", so winnings are exact integers.
export function winningsCents(stakeCents: number, payX: number): number {
  return stakeCents * payX
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const a = Math.abs(cents)
  return `${sign}$${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`
}
