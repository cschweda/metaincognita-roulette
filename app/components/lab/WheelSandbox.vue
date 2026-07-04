<template>
  <section
    aria-labelledby="wheel-sandbox-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4"
  >
    <h2
      id="wheel-sandbox-heading"
      class="text-sm font-semibold text-neutral-200"
    >
      Is the wheel true? — run it and find out
    </h2>

    <!-- Controls row -->
    <div class="flex flex-wrap gap-4 items-end">
      <!-- Variant selector -->
      <div class="flex flex-col gap-1">
        <label
          for="sandbox-variant"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Variant</label>
        <select
          id="sandbox-variant"
          v-model="variant"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="single">
            Single-zero (European)
          </option>
          <option value="double">
            Double-zero (American)
          </option>
        </select>
      </div>

      <!-- Spin count selector -->
      <div class="flex flex-col gap-1">
        <label
          for="sandbox-spins"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Spins</label>
        <select
          id="sandbox-spins"
          v-model.number="spins"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option :value="10_000">
            10 000
          </option>
          <option :value="100_000">
            100 000
          </option>
          <option :value="1_000_000">
            1 000 000
          </option>
        </select>
      </div>

      <!-- Run button -->
      <button
        :disabled="running"
        class="rounded px-4 py-1.5 text-xs font-semibold transition-colors"
        :class="running
          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
          : 'bg-amber-600 hover:bg-amber-500 text-neutral-950 cursor-pointer'"
        :aria-busy="running"
        @click="runSim"
      >
        <span v-if="running">Running…</span>
        <span v-else>Run simulation</span>
      </button>
    </div>

    <!-- Bias slider -->
    <div class="space-y-1.5">
      <label
        for="sandbox-bias"
        class="text-[10px] uppercase tracking-widest text-neutral-400"
      >
        Wheel bias — {{ biasLabel }}
      </label>
      <div class="flex items-center gap-3">
        <input
          id="sandbox-bias"
          v-model.number="biasPct"
          type="range"
          min="0"
          max="100"
          step="5"
          class="w-full accent-amber-500"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="biasPct"
          :aria-valuetext="biasLabel"
        >
        <span class="font-mono text-xs text-neutral-300 w-8 text-right shrink-0">{{ biasPct }}%</span>
      </div>
    </div>

    <!-- Apply / restore controls -->
    <div class="flex flex-wrap gap-2 items-center">
      <button
        class="rounded px-3 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white cursor-pointer transition-colors"
        @click="applyToTable"
      >
        Apply this wheel at the table
      </button>
      <button
        class="rounded px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer transition-colors"
        @click="restoreTrue"
      >
        Restore a true wheel
      </button>
      <span
        class="text-xs font-mono px-2 py-1 rounded"
        :class="tableWheelBiased
          ? 'bg-rose-900/60 text-rose-300 ring-1 ring-rose-700/50'
          : 'bg-emerald-900/60 text-emerald-400 ring-1 ring-emerald-700/50'"
      >
        {{ tableWheelBiased ? 'Table wheel: BIASED' : 'Table wheel: true' }}
      </span>
    </div>

    <!-- Results -->
    <div
      v-if="result"
      class="space-y-3"
    >
      <!-- Histogram -->
      <div>
        <p class="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">
          Landing distribution — {{ result.df + 1 }} pockets
        </p>
        <svg
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          :width="svgWidth"
          :height="svgHeight"
          class="w-full"
          role="img"
          aria-label="Pocket landing frequency histogram"
        >
          <!-- Bars -->
          <rect
            v-for="(bar, i) in histBars"
            :key="i"
            :x="bar.x"
            :y="bar.y"
            :width="bar.w"
            :height="bar.h"
            :fill="bar.fill"
            opacity="0.85"
          />
          <!-- Expected line -->
          <line
            :x1="0"
            :y1="expectedY"
            :x2="svgWidth"
            :y2="expectedY"
            stroke="#a3a3a3"
            stroke-width="1"
            stroke-dasharray="4 3"
          />
        </svg>
        <p class="text-[10px] text-neutral-400 mt-1">
          Dashed line = expected count ({{ expectedCount.toFixed(0) }} per pocket). Bars colored by pocket color.
        </p>
      </div>

      <!-- Verdict -->
      <div
        class="rounded-lg px-4 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"
        :class="result.fair
          ? 'bg-emerald-900/40 ring-1 ring-emerald-700/40'
          : 'bg-rose-900/40 ring-1 ring-rose-700/40'"
      >
        <span
          class="text-lg font-bold font-mono"
          :class="result.fair ? 'text-emerald-400' : 'text-rose-400'"
        >
          {{ result.fair ? '✓ statistically fair' : '✗ biased' }}
        </span>
        <span class="text-xs font-mono text-neutral-400">
          χ² = {{ result.chi.toFixed(1) }}
          (critical {{ chiCritical(result.df).toFixed(0) }}, df = {{ result.df }})
        </span>
      </div>

      <!-- Caption -->
      <p class="text-[11px] text-neutral-400 leading-snug italic">
        <span v-if="result.fair">
          Many revolutions + sensitive dependence = a uniform wheel. This is what a casino's inspection confirms.
        </span>
        <span v-else>
          A loose fret or a tilt favors a sector — exactly what Jagger and Hibbs hunted.
        </span>
      </p>

      <!-- House edge -->
      <div class="rounded bg-neutral-800/60 px-3 py-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono">
        <span>
          <span class="text-[10px] uppercase tracking-widest text-neutral-400 mr-1.5">Measured house edge</span>
          <span
            class="font-semibold text-rose-300"
          >{{ formatPercent(result.edge) }}</span>
        </span>
        <span class="text-xs text-neutral-400">
          theoretical:
          {{ variant === 'single' ? '2.70%' : '5.26%' }}
          ({{ variant === 'single' ? 'single-zero' : 'double-zero' }})
        </span>
      </div>
    </div>

    <!-- Running state placeholder -->
    <div
      v-else-if="running"
      class="rounded bg-neutral-800/40 px-4 py-6 text-center text-xs text-neutral-400 animate-pulse"
      role="status"
      aria-live="polite"
    >
      Simulating {{ spins.toLocaleString() }} spins…
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="rounded bg-neutral-800/20 px-4 py-4 text-center text-xs text-neutral-400"
    >
      Set the bias slider and hit <strong class="text-neutral-400">Run simulation</strong> to see the distribution.
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { runFrequencies, chiSquare, measureEdge } from '~/engine/sim'
import { WHEEL_ORDER, colorOf, pocketCount } from '~/engine/wheel'
import type { Bet, Rules } from '~/engine/bets'
import { chiCritical, isUniform } from './sandbox'
import { formatPercent } from '~/utils/format'
import { nextPaint } from '~/utils/nextPaint'

interface SimResult {
  counts: number[]
  chi: number
  df: number
  edge: number
  fair: boolean
}

const store = useRouletteStore()

const variant = ref(store.variant)
const spins = ref(100_000)
const biasPct = ref(0)
const running = ref(false)
const result = ref<SimResult | null>(null)

const biasLabel = computed(() => {
  if (biasPct.value === 0) return 'perfectly true'
  if (biasPct.value <= 20) return 'very slight'
  if (biasPct.value <= 50) return 'moderate'
  if (biasPct.value <= 80) return 'heavy'
  return 'rigged'
})

const tableWheelBiased = computed(() => !!store.wheelCondition.biasStrength)

// SVG histogram dimensions
const svgWidth = 400
const svgHeight = 120
const padTop = 8
const padBottom = 4

const expectedCount = computed(() => {
  if (!result.value) return 0
  const total = result.value.counts.reduce((a, b) => a + b, 0)
  return total / result.value.counts.length
})

const expectedY = computed(() => {
  if (!result.value) return svgHeight / 2
  const total = result.value.counts.reduce((a, b) => a + b, 0)
  const maxCount = Math.max(...result.value.counts)
  const maxH = svgHeight - padTop - padBottom
  const expected = total / result.value.counts.length
  return svgHeight - padBottom - (expected / maxCount) * maxH
})

const histBars = computed(() => {
  if (!result.value) return []
  const counts = result.value.counts
  const order = WHEEL_ORDER[variant.value]
  const maxCount = Math.max(...counts)
  const maxH = svgHeight - padTop - padBottom
  const barW = svgWidth / counts.length
  const gap = 1

  return counts.map((count, i) => {
    const pocket = order[i]!
    const color = colorOf(pocket)
    const fill = color === 'red' ? '#be123c' : color === 'black' ? '#404040' : '#059669'
    const h = maxCount > 0 ? (count / maxCount) * maxH : 0
    return {
      x: i * barW + gap / 2,
      y: svgHeight - padBottom - h,
      w: barW - gap,
      h,
      fill
    }
  })
})

async function runSim() {
  running.value = true
  result.value = null
  // Let the "Running…" placeholder actually paint before the synchronous
  // million-spin compute blocks the main thread (nextTick fires pre-paint).
  await nextPaint()

  const cond = biasPct.value > 0
    ? { biasStrength: biasPct.value / 100, biasCenter: 7, biasWidth: 5 }
    : {}
  const seed = (Date.now() & 0xffffffff) >>> 0
  const counts = runFrequencies(variant.value, spins.value, seed, cond)
  const chi = chiSquare(counts)
  const df = pocketCount(variant.value) - 1
  const redBet = (): Bet => ({ type: 'red', numbers: [], stakeCents: 100 })
  const rules: Rules = { variant: variant.value, evenMoney: 'none' }
  const edge = measureEdge(variant.value, redBet, rules, spins.value, seed ^ 0x55)
  result.value = { counts, chi, df, edge, fair: isUniform(chi, df) }
  running.value = false
}

function applyToTable() {
  store.setWheelCondition(
    biasPct.value > 0
      ? { biasStrength: biasPct.value / 100, biasCenter: 7, biasWidth: 5 }
      : {}
  )
}

function restoreTrue() {
  store.setWheelCondition({})
}
</script>
