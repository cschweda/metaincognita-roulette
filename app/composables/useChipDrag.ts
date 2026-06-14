import { ref } from 'vue'
import type { Pocket } from '~/engine/wheel'
import type { BetType } from '~/engine/bets'

function parseZone(raw: string | null): { type: BetType, numbers: Pocket[] } | null {
  if (!raw) return null
  const idx = raw.indexOf(':')
  if (idx === -1) return null
  const type = raw.slice(0, idx) as BetType
  const nums = raw.slice(idx + 1)
  const numbers: Pocket[] = nums === ''
    ? []
    : nums.split(',').map(s => (s === '00' ? '00' : Number(s)))
  return { type, numbers }
}

export function useChipDrag(onDrop: (descriptor: { type: BetType, numbers: Pocket[] }, cents: number) => void) {
  const dragging = ref(false)
  const chipCents = ref(0)
  const x = ref(0)
  const y = ref(0)
  let startX = 0
  let startY = 0
  let moved = false

  function onMove(ev: PointerEvent) {
    x.value = ev.clientX
    y.value = ev.clientY
    if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true
  }
  function onUp(ev: PointerEvent) {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    dragging.value = false
    if (moved) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as Element | null
      const zoneEl = el?.closest('[data-zone]')
      const descriptor = parseZone(zoneEl?.getAttribute('data-zone') ?? null)
      if (descriptor) onDrop(descriptor, chipCents.value)
    }
  }
  function start(cents: number, ev: PointerEvent) {
    chipCents.value = cents
    startX = ev.clientX
    startY = ev.clientY
    x.value = ev.clientX
    y.value = ev.clientY
    moved = false
    dragging.value = true
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  return { dragging, chipCents, x, y, start }
}
