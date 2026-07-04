<template>
  <div
    class="chip-tray"
    role="group"
    aria-label="Chip denominations"
  >
    <button
      v-for="c in chips"
      :key="c"
      type="button"
      class="chip"
      :class="chipClass(c)"
      :disabled="c > maxCents"
      :aria-label="'Chip ' + formatCents(c) + (c > maxCents ? ' (more than your bankroll)' : '')"
      :aria-pressed="c === selected"
      style="touch-action: none"
      @click="emit('select', c)"
      @pointerdown="(ev) => { if (c <= maxCents) emit('dragstart', { cents: c, ev }) }"
    >
      {{ formatCents(c) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { rouletteConfig } from '../../../roulette.config'
import { formatCents } from '~/utils/format'

const props = defineProps<{
  selected: number
  maxCents: number
}>()

const emit = defineEmits<{
  select: [cents: number]
  dragstart: [payload: { cents: number, ev: PointerEvent }]
}>()

const chips = rouletteConfig.chips as readonly number[]

// Casino color order, applied by tray position — not by hardcoded cent values,
// so reconfiguring rouletteConfig.chips can't leave a chip styleless.
const CHIP_STYLES = ['chip-white', 'chip-red', 'chip-green', 'chip-black', 'chip-purple'] as const

function chipClass(cents: number): Record<string, boolean> {
  const idx = Math.max(0, chips.indexOf(cents))
  const style = CHIP_STYLES[idx % CHIP_STYLES.length]!
  return {
    [style]: true,
    'chip-selected': cents === props.selected && cents <= props.maxCents,
    'chip-disabled': cents > props.maxCents
  }
}
</script>

<style scoped>
.chip-tray {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}

.chip {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.35);
  font-weight: 800;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, box-shadow 0.1s, outline-offset 0.1s;
  outline: none;
  position: relative;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.chip:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chip:focus-visible {
  outline: 2px solid var(--gold, #d4a847);
  outline-offset: 2px;
}

.chip-disabled,
.chip-disabled:hover {
  opacity: 0.3;
  filter: grayscale(0.65);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.chip-selected {
  outline: 2px solid var(--gold, #d4a847);
  outline-offset: 3px;
  transform: scale(1.1);
}

.chip-white {
  background: radial-gradient(circle at 35% 35%, #e8e8e8, #b0b0b0);
  color: #222;
  text-shadow: none;
  border-color: rgba(0, 0, 0, 0.2);
}

.chip-red {
  background: radial-gradient(circle at 35% 35%, #e03030, #9b1a1a);
}

.chip-green {
  background: radial-gradient(circle at 35% 35%, #2a9d54, #155c30);
}

.chip-black {
  background: radial-gradient(circle at 35% 35%, #444, #111);
}

.chip-purple {
  background: radial-gradient(circle at 35% 35%, #9b59b6, #5e2b7a);
}
</style>
