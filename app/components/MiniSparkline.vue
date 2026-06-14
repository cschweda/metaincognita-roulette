<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    :width="W"
    :height="H"
    preserveAspectRatio="none"
    role="img"
    :aria-label="ariaLabel"
    class="shrink-0"
  >
    <polyline
      v-if="points"
      :points="points"
      fill="none"
      :stroke="up ? '#34d399' : '#fb7185'"
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'

const store = useRouletteStore()
const W = 60
const H = 18

const up = computed(() => {
  const v = store.bankrollHistory
  return v.length < 2 || v[v.length - 1]! >= v[0]!
})

const points = computed(() => {
  const v = store.bankrollHistory
  if (v.length < 2) return null
  const min = Math.min(...v)
  const max = Math.max(...v)
  const range = max - min || 1
  return v.map((y, i) => {
    const x = (i / (v.length - 1)) * W
    const yy = H - ((y - min) / range) * (H - 3) - 1.5
    return `${x.toFixed(1)},${yy.toFixed(1)}`
  }).join(' ')
})

const ariaLabel = computed(() =>
  store.bankrollHistory.length < 2
    ? 'Session bankroll trend'
    : `Session bankroll trend, ${up.value ? 'up' : 'down'}`
)
</script>
