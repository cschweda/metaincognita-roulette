// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BankrollStack from '../../app/components/wheel/BankrollStack.vue'

describe('BankrollStack', () => {
  it('renders more chips for a bigger bankroll', async () => {
    const small = await mountSuspended(BankrollStack, { props: { bankrollCents: 5_000, startingCents: 100_000 } })
    const big = await mountSuspended(BankrollStack, { props: { bankrollCents: 100_000, startingCents: 100_000 } })
    expect(big.findAll('[data-chip]').length).toBeGreaterThan(small.findAll('[data-chip]').length)
  })
})
