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
      :aria-label="'Chip ' + formatCents(c)"
      :aria-pressed="c === selected"
      @click="emit('select', c)"
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
}>()

const emit = defineEmits<{
  select: [cents: number]
}>()

const chips = rouletteConfig.chips as readonly number[]

function chipClass(cents: number): Record<string, boolean> {
  return {
    'chip-selected': cents === props.selected,
    'chip-white': cents === 100,
    'chip-red': cents === 500,
    'chip-green': cents === 2_500,
    'chip-black': cents === 10_000,
    'chip-purple': cents === 50_000
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
