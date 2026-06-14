// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RouletteMat from '../../app/components/wheel/RouletteMat.vue'

describe('RouletteMat', () => {
  it('renders 1–36 and a single green zero (no 00) for single-zero', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'single', bets: [] } })
    const zones = w.findAll('[data-zone]').map(z => z.attributes('data-zone'))
    expect(zones).toContain('straight:0')
    expect(zones).toContain('straight:36')
    expect(zones).not.toContain('straight:00')
  })
  it('includes the 00 zone for double-zero', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'double', bets: [] } })
    const zones = w.findAll('[data-zone]').map(z => z.attributes('data-zone'))
    expect(zones).toContain('straight:00')
  })
  it('emits place with a straight descriptor when a number is clicked', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'single', bets: [] } })
    const cell = w.findAll('[data-zone]').find(el => el.attributes('data-zone') === 'straight:7')
    expect(cell).toBeTruthy()
    await cell!.trigger('click')
    const ev = w.emitted('place')
    expect(ev).toBeTruthy()
    expect(ev![0]![0]).toMatchObject({ type: 'straight', numbers: [7] })
  })
  it('shows a chip badge on a zone that has a bet', async () => {
    const w = await mountSuspended(RouletteMat, { props: { variant: 'single', bets: [{ type: 'red', numbers: [], stakeCents: 500 }] } })
    expect(w.text()).toContain('$5')
  })
})
