import { test, expect } from '@playwright/test'

test('a spin settles even when you navigate away mid-animation', async ({ page }) => {
  // Real motion: the regression only exists while the ~10s realistic replay runs
  // (reduced motion settles synchronously and never had the bug).
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.getByRole('button', { name: /take a seat/i }).click()
  await expect(page).toHaveURL(/\/wheel/)

  await page.locator('[data-zone="red:"]').click()
  await page.locator('.spin-btn').click()
  await expect(page.locator('.spin-btn')).toBeDisabled() // animation underway
  await page.waitForTimeout(1000) // ~1s into the replay

  await page.getByRole('button', { name: 'History' }).click()
  await expect(page).toHaveURL(/\/history/)

  // Leaving the table settles the round — the engine already decided the pocket.
  await expect.poll(() =>
    page.evaluate(() => JSON.parse(localStorage.getItem('roulette-session-v1')!).sessionStats.spins)
  ).toBe(1)

  // And back at the table the game is playable, not stuck on 'Spinning…'.
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/wheel/)
  await expect(page.locator('.spin-btn')).toBeEnabled()
  await expect(page.locator('.spin-btn')).toContainText(/spin/i)
})
