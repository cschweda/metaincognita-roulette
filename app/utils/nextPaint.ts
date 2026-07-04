/**
 * Resolve after the browser has painted the current DOM state.
 *
 * `await nextTick()` is NOT enough before a long synchronous compute: it
 * resolves in a microtask, before paint, so a "Running…" placeholder never
 * appears. rAF fires just before the next paint; the nested setTimeout lands
 * just after it — only then is it safe to block the main thread.
 */
export function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'undefined') {
      setTimeout(resolve, 0)
      return
    }
    requestAnimationFrame(() => setTimeout(resolve, 0))
  })
}
