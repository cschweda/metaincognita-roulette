// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppHubLink from '../../app/components/AppHubLink.vue'
import DefaultLayout from '../../app/layouts/default.vue'

const HUB_URL = 'https://metaincognita.com'

// Tag-agnostic on purpose: the test must be able to catch the link being
// downgraded to something that is not an anchor.
const SELECTOR = '[aria-label^="METAINCOGNITA"]'

describe('AppHubLink — the hub exit', () => {
  // It lives in the shared top bar, so "never gated" means it survives every
  // route, including the ones where the Back button's v-if flips.
  it('renders in the top bar on the index', async () => {
    const w = await mountSuspended(DefaultLayout, { route: '/' })
    expect(w.find(SELECTOR).exists()).toBe(true)
  })

  it('renders in the top bar on a deep route', async () => {
    const wheel = await mountSuspended(DefaultLayout, { route: '/wheel' })
    expect(wheel.find(SELECTOR).exists()).toBe(true)
    const history = await mountSuspended(DefaultLayout, { route: '/history' })
    expect(history.find(SELECTOR).exists()).toBe(true)
  })

  it('points at the hub with an absolute URL', async () => {
    const w = await mountSuspended(AppHubLink)
    expect(w.find(SELECTOR).attributes('href')).toBe(HUB_URL)
  })

  // A router push would keep the player inside the SPA. This has to be a real
  // anchor the browser follows out of the app.
  it('is a real anchor, not a router link', async () => {
    const w = await mountSuspended(AppHubLink)
    expect(w.find(SELECTOR).element.tagName).toBe('A')
    expect(w.findAllComponents({ name: 'NuxtLink' })).toHaveLength(0)
    expect(w.findAllComponents({ name: 'RouterLink' })).toHaveLength(0)
  })

  // An exit, not a side trip: a new tab would leave the trainer running behind it.
  it('exits in the same tab — no target', async () => {
    const w = await mountSuspended(AppHubLink)
    expect(w.find(SELECTOR).attributes('target')).toBeUndefined()
  })

  // WCAG 2.5.3 Label in Name: the accessible name must contain the visible
  // label verbatim. "Meta Incognita" reads fine and fails on the space.
  it('has an accessible name containing the visible wordmark', async () => {
    const w = await mountSuspended(AppHubLink)
    const link = w.find(SELECTOR)
    const visibleLabel = link.text().trim()
    expect(visibleLabel).toBe('METAINCOGNITA')
    expect(link.attributes('aria-label')).toContain(visibleLabel)
  })
})
