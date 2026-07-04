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

test('inside combination bets place via the line hotspots', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: /take a seat/i }).click()
  await expect(page).toHaveURL(/\/wheel/)

  // The corner 7-8-10-11 sits on a gap-line hotspot, not a number cell.
  await page.locator('[data-zone="corner:7,8,10,11"]').click()
  await expect(page.locator('.staked-readout')).toContainText('$1')
  await expect(page.locator('.line-chip').first()).toBeVisible()

  const bets = await page.evaluate(() => JSON.parse(localStorage.getItem('roulette-session-v1')!).bets)
  expect(bets).toEqual([{ type: 'corner', numbers: [7, 8, 10, 11], stakeCents: 100 }])
})

test('broke modal offers a rebuy that restores the buy-in and logs it', async ({ page }) => {
  // Arrive at the table already broke: bankroll 0 after one all-in loss.
  await page.addInitScript(() => {
    localStorage.setItem('roulette-session-v1', JSON.stringify({
      version: 1,
      presetId: 'american',
      variant: 'double',
      evenMoney: 'none',
      playerName: 'E2E',
      bankrollCents: 0,
      selectedChipCents: 0,
      bets: [],
      spinHistory: [{ pocket: 7, netCents: -20_000 }],
      sessionStats: { spins: 1, wageredCents: 20_000, netCents: -20_000, wins: 0, losses: 1 },
      bankrollHistory: [20_000, 0],
      wheelCondition: {},
      sessionLog: [{ event: 'spin', pocket: 7, stakeCents: 20_000, returnCents: 0, netCents: -20_000, bankrollCents: 0 }],
      spinSpeed: 'realistic'
    }))
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/wheel')

  await expect(page.getByText(/out of chips/i).first()).toBeVisible()
  await page.getByRole('button', { name: /buy more chips/i }).click()
  await expect(page.getByText(/out of chips/i)).toBeHidden()

  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('roulette-session-v1')!))
  expect(session.bankrollCents).toBe(20_000) // re-bought the original buy-in
  expect(session.sessionLog.at(-1)).toMatchObject({ event: 'rebuy', returnCents: 20_000 })
})
