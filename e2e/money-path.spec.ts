import { test, expect } from '@playwright/test'

test('place a bet, spin, settle, and persist across reload', async ({ page }) => {
  // Explicitly emulate reduced motion so window.matchMedia returns true in the
  // page JS (the config-level reducedMotion:'reduce' only affects CSS @media).
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: /take a seat/i }).click()
  await expect(page).toHaveURL(/\/wheel/)

  await page.locator('[data-zone="red:"]').click()
  await expect(page.locator('.staked-readout')).toContainText('$')

  await page.locator('.spin-btn').click()
  await expect(page.locator('.result-pill')).toHaveText(/Won|Lost|No win/, { timeout: 8000 })

  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('roulette-session-v1')!).sessionStats)
  expect(stats.spins).toBe(1)
  expect(stats.wageredCents).toBeGreaterThan(0)

  await page.reload()
  await expect(page).toHaveURL(/\/wheel/)
  const spinsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('roulette-session-v1')!).sessionStats.spins)
  expect(spinsAfter).toBe(1)
})

test('standalone teaching routes render without a session', async ({ page }) => {
  for (const path of ['/analysis', '/learn', '/lab', '/drills']) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(path))
    await expect(page.locator('h1').first()).toBeVisible()
  }
})
