import { describe, it, expect } from 'vitest'
import { nextPaint } from '../../app/utils/nextPaint'

describe('nextPaint', () => {
  // Unlike nextTick (a microtask that resolves BEFORE the browser paints),
  // nextPaint must hand control back to the event loop so a "Running…"
  // placeholder actually renders before a long synchronous compute starts.
  it('resolves asynchronously via a macrotask, not a microtask', async () => {
    let macrotaskRan = false
    setTimeout(() => {
      macrotaskRan = true
    }, 0)
    await nextPaint()
    expect(macrotaskRan).toBe(true)
  })

  it('resolves even without requestAnimationFrame (node fallback)', async () => {
    expect(typeof requestAnimationFrame === 'undefined').toBe(true)
    await expect(nextPaint()).resolves.toBeUndefined()
  })
})
