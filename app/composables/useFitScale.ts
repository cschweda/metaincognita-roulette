import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/**
 * Scale-to-fit helper.
 *
 * Measures an available-width `container` and the natural (unscaled) size of a
 * `content` element, and returns a `scale` factor so the content fits the
 * container's width: `scale = min(1, containerWidth / naturalWidth)`.
 *
 * The caller applies `transform: scale(scale)` (origin top-left) to `content`
 * and sizes a wrapper to `naturalWidth*scale × naturalHeight*scale` so the rest
 * of the layout flows correctly. Because `transform` is visual-only, the
 * fixed-pixel geometry inside `content` (e.g. the betting-mat hotspots) keeps
 * working — the browser maps clicks/`elementFromPoint` through the transform.
 *
 * `offsetWidth`/`offsetHeight` are layout sizes unaffected by the transform, so
 * they always report the natural box even while the element is scaled.
 */
export function useFitScale(
  container: Ref<HTMLElement | null>,
  content: Ref<HTMLElement | null>
) {
  const scale = ref(1)
  const naturalWidth = ref(0)
  const naturalHeight = ref(0)

  let observer: ResizeObserver | null = null
  let frame = 0

  function measure(): void {
    const c = container.value
    const el = content.value
    if (!c || !el) return
    const natW = el.offsetWidth
    const natH = el.offsetHeight
    naturalWidth.value = natW
    naturalHeight.value = natH
    scale.value = natW > 0 ? Math.min(1, c.clientWidth / natW) : 1
  }

  function schedule(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      measure()
      return
    }
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(measure)
  }

  onMounted(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule)
      if (container.value) observer.observe(container.value)
      if (content.value) observer.observe(content.value)
    }
  })

  onBeforeUnmount(() => {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame)
    observer?.disconnect()
    observer = null
  })

  return { scale, naturalWidth, naturalHeight }
}
