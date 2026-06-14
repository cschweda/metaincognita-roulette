<template>
  <div class="w-full rounded-xl bg-neutral-900/70 border border-neutral-800 px-4 py-3 flex items-center justify-between gap-4">
    <div class="min-w-0">
      <div class="text-[11px] uppercase tracking-wide text-neutral-400">
        Session net
      </div>
      <div
        class="font-mono text-xl leading-tight"
        :class="net >= 0 ? 'text-emerald-400' : 'text-rose-400'"
      >
        {{ formatSignedCents(net) }}
      </div>
      <div class="text-[11px] text-neutral-400 mt-0.5">
        {{ store.sessionStats.spins }} spins · {{ wins }}W–{{ losses }}L
      </div>
    </div>
    <svg
      v-if="spark"
      :viewBox="`0 0 ${W} ${H}`"
      :width="W"
      :height="H"
      class="shrink-0"
      preserveAspectRatio="none"
      role="img"
      aria-label="Bankroll trend"
    >
      <defs>
        <linearGradient
          :id="gradId"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            :stop-color="up ? '#34d399' : '#fb7185'"
            stop-opacity="0.35"
          />
          <stop
            offset="1"
            :stop-color="up ? '#34d399' : '#fb7185'"
            stop-opacity="0"
          />
        </linearGradient>
      </defs>
      <polygon
        :points="spark.area"
        :fill="`url(#${gradId})`"
      />
      <polyline
        :points="spark.line"
        fill="none"
        :stroke="up ? '#34d399' : '#fb7185'"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle
        v-for="(d, i) in spark.dots"
        :key="i"
        :cx="d.x"
        :cy="d.y"
        r="2"
        :fill="up ? '#34d399' : '#fb7185'"
        stroke="#0c0c0c"
        stroke-width="0.6"
      />
    </svg>
    <div
      v-else
      class="text-[11px] text-neutral-500 shrink-0 w-[140px] text-center"
    >
      spin to chart your bankroll
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatSignedCents } from '~/utils/format'

const store = useRouletteStore()
const W = 140
const H = 46
const gradId = 'spark-grad'

const net = computed(() => store.sessionStats.netCents)
const wins = computed(() => store.spinHistory.filter(s => s.netCents > 0).length)
const losses = computed(() => store.spinHistory.filter(s => s.netCents < 0).length)

const up = computed(() => {
  const v = store.bankrollHistory
  return v.length < 2 || v[v.length - 1]! >= v[0]!
})

const spark = computed(() => {
  const v = store.bankrollHistory
  if (v.length < 2) return null
  const min = Math.min(...v)
  const max = Math.max(...v)
  const range = max - min || 1
  const dots = v.map((y, i) => ({
    x: +((i / (v.length - 1)) * W).toFixed(1),
    y: +(H - ((y - min) / range) * (H - 4) - 2).toFixed(1)
  }))
  const pts = dots.map(d => `${d.x},${d.y}`)
  return { line: pts.join(' '), area: `0,${H} ${pts.join(' ')} ${W},${H}`, dots }
})
</script>
