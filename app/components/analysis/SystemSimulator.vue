<template>
  <section
    aria-labelledby="system-sim-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4"
  >
    <h2
      id="system-sim-heading"
      class="text-sm font-semibold text-neutral-200"
    >
      Betting-system simulator — can a progression beat the wheel?
    </h2>

    <!-- Controls -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <!-- System -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-system"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >System</label>
        <select
          id="sim-system"
          v-model="system"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="flat">
            Flat (no progression)
          </option>
          <option value="martingale">
            Martingale (double on loss)
          </option>
          <option value="dalembert">
            D'Alembert
          </option>
          <option value="fibonacci">
            Fibonacci
          </option>
          <option value="paroli">
            Paroli (reverse Martingale)
          </option>
        </select>
      </div>

      <!-- Variant -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-variant"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Variant</label>
        <select
          id="sim-variant"
          v-model="variant"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="single">
            Single-zero
          </option>
          <option value="double">
            Double-zero
          </option>
        </select>
      </div>

      <!-- Even-money rule -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-rule"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Zero rule</label>
        <select
          id="sim-rule"
          v-model="evenMoney"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="none">
            None
          </option>
          <option value="la_partage">
            La Partage
          </option>
          <option value="surrender">
            Surrender
          </option>
        </select>
      </div>

      <!-- Even-money bet -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-bet"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Bet</label>
        <select
          id="sim-bet"
          v-model="betType"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="red">
            Red
          </option>
          <option value="black">
            Black
          </option>
          <option value="even">
            Even
          </option>
          <option value="odd">
            Odd
          </option>
          <option value="low">
            Low (1-18)
          </option>
          <option value="high">
            High (19-36)
          </option>
        </select>
      </div>

      <!-- Base unit -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-unit"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Base unit</label>
        <select
          id="sim-unit"
          v-model.number="baseUnitCents"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option
            v-for="chip in chips"
            :key="chip"
            :value="chip"
          >
            {{ formatCents(chip) }}
          </option>
        </select>
      </div>

      <!-- Trials -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-trials"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Sessions</label>
        <select
          id="sim-trials"
          v-model.number="trials"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option :value="1000">
            1 000
          </option>
          <option :value="5000">
            5 000
          </option>
          <option :value="10000">
            10 000
          </option>
        </select>
      </div>

      <!-- Starting bankroll -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-bankroll"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Buy-in</label>
        <input
          id="sim-bankroll"
          v-model.number="startDollars"
          type="number"
          min="1"
          step="1"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
      </div>

      <!-- Max rounds -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-rounds"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Max rounds</label>
        <input
          id="sim-rounds"
          v-model.number="maxRounds"
          type="number"
          min="1"
          max="2000"
          step="1"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
      </div>

      <!-- Table max -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-tablemax"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Table max</label>
        <input
          id="sim-tablemax"
          v-model.number="tableMaxDollars"
          type="number"
          min="1"
          step="1"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
      </div>

      <!-- Target bankroll (optional) -->
      <div class="flex flex-col gap-1">
        <label
          for="sim-target"
          class="text-[10px] uppercase tracking-widest text-neutral-400"
        >Target (blank = off)</label>
        <input
          id="sim-target"
          v-model.number="targetDollars"
          type="number"
          min="1"
          step="1"
          placeholder="off"
          class="rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-neutral-400"
        >
      </div>
    </div>

    <!-- Run button -->
    <div class="flex items-center gap-3">
      <button
        :disabled="running"
        class="rounded px-4 py-1.5 text-xs font-semibold transition-colors"
        :class="running
          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
          : 'bg-amber-600 hover:bg-amber-500 text-neutral-950 cursor-pointer'"
        :aria-busy="running"
        @click="run"
      >
        <span v-if="running">Running…</span>
        <span v-else>Run {{ trials.toLocaleString() }} sessions</span>
      </button>
      <span
        v-if="result"
        class="text-[11px] text-neutral-400 font-mono"
      >
        {{ systemLabel }} · {{ variant === 'single' ? 'single-zero' : 'double-zero' }}
      </span>
    </div>

    <!-- Results -->
    <div
      v-if="result"
      class="space-y-4"
    >
      <!-- Stat cards -->
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
        <div class="rounded bg-neutral-800/60 px-2 py-2">
          <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
            Ruin rate
          </dt>
          <dd class="text-base text-rose-400">
            {{ (result.ruinRate * 100).toFixed(1) }}%
          </dd>
        </div>
        <div
          v-if="targetActive"
          class="rounded bg-neutral-800/60 px-2 py-2"
        >
          <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
            Hit target
          </dt>
          <dd class="text-base text-emerald-400">
            {{ (result.targetRate * 100).toFixed(1) }}%
          </dd>
        </div>
        <div class="rounded bg-neutral-800/60 px-2 py-2">
          <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
            Median final
          </dt>
          <dd
            class="text-base"
            :class="result.medianFinalCents >= startBankrollCents ? 'text-emerald-400' : 'text-rose-400'"
          >
            {{ formatCents(result.medianFinalCents) }}
          </dd>
        </div>
        <div class="rounded bg-neutral-800/60 px-2 py-2">
          <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
            Mean final
          </dt>
          <dd
            class="text-base"
            :class="result.meanFinalCents >= startBankrollCents ? 'text-emerald-400' : 'text-rose-400'"
          >
            {{ formatCents(result.meanFinalCents) }}
          </dd>
        </div>
      </dl>

      <!-- Bankroll-fan chart -->
      <div>
        <p class="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">
          Bankroll over {{ maxRounds }} rounds — p10–p90 spread of {{ trials.toLocaleString() }} sessions
        </p>
        <svg
          :viewBox="`0 0 ${fanW} ${fanH}`"
          :width="fanW"
          :height="fanH"
          class="w-full"
          role="img"
          :aria-label="fanAriaLabel"
        >
          <!-- p10-p90 band -->
          <polygon
            :points="band10_90"
            fill="#f43f5e"
            opacity="0.15"
          />
          <!-- p25-p75 band -->
          <polygon
            :points="band25_75"
            fill="#f43f5e"
            opacity="0.3"
          />
          <!-- start-bankroll reference -->
          <line
            :x1="fanPadL"
            :y1="startY"
            :x2="fanW - fanPadR"
            :y2="startY"
            stroke="#a3a3a3"
            stroke-width="1"
            stroke-dasharray="4 3"
          />
          <!-- p50 median line -->
          <polyline
            :points="medianLine"
            fill="none"
            stroke="#f43f5e"
            stroke-width="2"
          />
          <!-- y-axis start label -->
          <text
            :x="fanPadL - 4"
            :y="startY + 3"
            text-anchor="end"
            fill="#a3a3a3"
            font-size="9"
            font-family="monospace"
          >{{ formatCents(startBankrollCents) }}</text>
          <!-- x-axis round count -->
          <text
            :x="fanW - fanPadR"
            :y="fanH - 2"
            text-anchor="end"
            fill="#a3a3a3"
            font-size="9"
            font-family="monospace"
          >{{ maxRounds }} rounds</text>
          <text
            :x="fanPadL"
            :y="fanH - 2"
            text-anchor="start"
            fill="#a3a3a3"
            font-size="9"
            font-family="monospace"
          >0</text>
        </svg>
        <p class="text-[10px] text-neutral-400 mt-1">
          Solid line = median bankroll. Shaded bands = middle 50% (dark) and middle 80% (light). Dashed line = your buy-in.
        </p>
      </div>

      <!-- Outcome histogram -->
      <div>
        <p class="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">
          Where {{ trials.toLocaleString() }} sessions finished
        </p>
        <svg
          :viewBox="`0 0 ${histW} ${histH}`"
          :width="histW"
          :height="histH"
          class="w-full"
          role="img"
          :aria-label="histAriaLabel"
        >
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
          <!-- start-bankroll line -->
          <line
            :x1="startHistX"
            :y1="0"
            :x2="startHistX"
            :y2="histH - histPadBottom"
            stroke="#a3a3a3"
            stroke-width="1"
            stroke-dasharray="4 3"
          />
          <text
            :x="startHistX"
            :y="histH - 1"
            text-anchor="middle"
            fill="#a3a3a3"
            font-size="9"
            font-family="monospace"
          >buy-in</text>
        </svg>
        <p class="text-[10px] text-neutral-400 mt-1">
          Bars left of the dashed line lost money; bars right of it finished ahead. Rose = below buy-in, emerald = at or above.
        </p>
      </div>

      <!-- Verdict -->
      <div class="rounded-lg px-4 py-3 bg-rose-900/40 ring-1 ring-rose-700/40">
        <p class="text-sm font-bold text-rose-200 leading-snug">
          Across {{ trials.toLocaleString() }} sessions you finished below your
          {{ formatCents(startBankrollCents) }} buy-in {{ pctBelow.toFixed(1) }}% of the time.
        </p>
        <p class="text-xs text-neutral-400 mt-1">
          The progression changes the shape of the ride — never the destination. Expected loss per round
          stays fixed at the house edge, whatever the staking plan.
        </p>
      </div>
    </div>

    <!-- Running placeholder -->
    <div
      v-else-if="running"
      class="rounded bg-neutral-800/40 px-4 py-6 text-center text-xs text-neutral-400 animate-pulse"
      role="status"
      aria-live="polite"
    >
      Simulating {{ trials.toLocaleString() }} sessions…
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="rounded bg-neutral-800/20 px-4 py-4 text-center text-xs text-neutral-400"
    >
      Pick a system and hit <strong class="text-neutral-400">Run</strong> to simulate thousands of sessions.
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Variant } from '~/engine/wheel'
import type { EvenMoneyRule, BetType } from '~/engine/bets'
import { type SystemId, type SystemConfig, type TrialsResult, runTrials } from '~/engine/systems'
import { rouletteConfig } from '~~/roulette.config'
import { formatCents } from '~/utils/format'

// ── Controls ──────────────────────────────────────────────────────────────────
const chips = rouletteConfig.chips

const system = ref<SystemId>('flat')
const variant = ref<Variant>('single')
const evenMoney = ref<EvenMoneyRule>('none')
const betType = ref<BetType>('red')
const baseUnitCents = ref<number>(1000)
const startDollars = ref<number>(200) // 20000¢
const maxRounds = ref<number>(200)
const tableMaxDollars = ref<number>(50) // 5000¢
const targetDollars = ref<number | null>(null) // blank = off
const trials = ref<number>(1000)

const running = ref(false)
const result = ref<TrialsResult | null>(null)
// Snapshot the start bankroll used for the LAST run, so charts/verdict stay
// consistent even if the user edits the input before re-running.
const startBankrollCents = ref<number>(20000)

const systemLabels: Record<SystemId, string> = {
  flat: 'Flat',
  martingale: 'Martingale',
  dalembert: 'D\'Alembert',
  fibonacci: 'Fibonacci',
  paroli: 'Paroli'
}
const systemLabel = computed(() => systemLabels[system.value])

const targetActive = computed(() => result.value !== null && targetSnapshot.value !== undefined)
const targetSnapshot = ref<number | undefined>(undefined)

// ── Run ───────────────────────────────────────────────────────────────────────
async function run() {
  running.value = true
  result.value = null
  await nextTick()

  const start = Math.max(1, Math.round((startDollars.value || 0))) * 100
  const tableMax = Math.max(1, Math.round((tableMaxDollars.value || 0))) * 100
  const target = targetDollars.value && targetDollars.value > 0
    ? Math.round(targetDollars.value) * 100
    : undefined

  const config: SystemConfig = {
    system: system.value,
    variant: variant.value,
    evenMoney: evenMoney.value,
    betType: betType.value,
    baseUnitCents: baseUnitCents.value,
    startBankrollCents: start,
    maxRounds: Math.max(1, Math.round(maxRounds.value || 1)),
    tableMaxCents: tableMax,
    ...(target !== undefined ? { targetBankrollCents: target } : {})
  }

  // Browser crypto for a fresh seed each run — NOT engine code.
  const seed = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0]!))

  // Snapshot the figures the visualizations depend on.
  startBankrollCents.value = start
  targetSnapshot.value = target

  // Let the spinner paint before the (synchronous) heavy compute.
  await nextTick()
  result.value = runTrials(config, trials.value, seed)
  running.value = false
}

// ── Derived: verdict ────────────────────────────────────────────────────────────
const pctBelow = computed(() => {
  if (!result.value) return 0
  const below = result.value.finals.filter(f => f < startBankrollCents.value).length
  return (below / result.value.trials) * 100
})

// ── Bankroll-fan chart geometry ─────────────────────────────────────────────────
const fanW = 640
const fanH = 220
const fanPadL = 44
const fanPadR = 8
const fanPadT = 8
const fanPadB = 16

// Downsample band arrays to <= 120 x-samples.
const MAX_SAMPLES = 120
const sampleIdx = computed<number[]>(() => {
  const n = maxRounds.value
  if (n <= MAX_SAMPLES) return Array.from({ length: n }, (_, i) => i)
  const out: number[] = []
  for (let s = 0; s < MAX_SAMPLES; s++) {
    out.push(Math.round((s / (MAX_SAMPLES - 1)) * (n - 1)))
  }
  return out
})

// y-scale: 0 .. max(p90)*1.05
const fanYMax = computed(() => {
  if (!result.value) return 1
  const maxP90 = Math.max(...result.value.bands.p90, startBankrollCents.value)
  return Math.max(maxP90 * 1.05, 1)
})

function fanX(roundIdx: number): number {
  const n = Math.max(1, maxRounds.value - 1)
  const plotW = fanW - fanPadL - fanPadR
  return fanPadL + (roundIdx / n) * plotW
}
function fanY(cents: number): number {
  const plotH = fanH - fanPadT - fanPadB
  const frac = cents / fanYMax.value
  return fanPadT + (1 - frac) * plotH
}

const startY = computed(() => fanY(startBankrollCents.value))

function polyFromBand(arr: number[]): string {
  return sampleIdx.value.map(i => `${fanX(i).toFixed(1)},${fanY(arr[i] ?? 0).toFixed(1)}`).join(' ')
}

// Closed polygon: lower band forward, upper band reversed.
function bandPolygon(lower: number[], upper: number[]): string {
  const idx = sampleIdx.value
  const top = idx.map(i => `${fanX(i).toFixed(1)},${fanY(upper[i] ?? 0).toFixed(1)}`)
  const bottom = [...idx].reverse().map(i => `${fanX(i).toFixed(1)},${fanY(lower[i] ?? 0).toFixed(1)}`)
  return [...top, ...bottom].join(' ')
}

const band10_90 = computed(() => result.value ? bandPolygon(result.value.bands.p10, result.value.bands.p90) : '')
const band25_75 = computed(() => result.value ? bandPolygon(result.value.bands.p25, result.value.bands.p75) : '')
const medianLine = computed(() => result.value ? polyFromBand(result.value.bands.p50) : '')

const fanAriaLabel = computed(() => {
  if (!result.value) return 'Bankroll fan chart'
  return `Bankroll fan chart over ${maxRounds.value} rounds. Median ends near ${formatCents(result.value.medianFinalCents)} versus a ${formatCents(startBankrollCents.value)} buy-in.`
})

// ── Outcome histogram geometry ──────────────────────────────────────────────────
const histW = 640
const histH = 160
const histPadBottom = 14
const HIST_BINS = 24

const histStats = computed(() => {
  if (!result.value) return null
  const finals = result.value.finals
  let min = Math.min(...finals)
  let max = Math.max(...finals)
  // avoid zero-width range
  if (min === max) {
    min -= 100
    max += 100
  }
  const span = max - min
  const counts = new Array(HIST_BINS).fill(0)
  for (const f of finals) {
    let b = Math.floor(((f - min) / span) * HIST_BINS)
    if (b >= HIST_BINS) b = HIST_BINS - 1
    if (b < 0) b = 0
    counts[b]++
  }
  return { min, max, span, counts, maxCount: Math.max(...counts) }
})

const histBars = computed(() => {
  const s = histStats.value
  if (!s) return []
  const plotH = histH - histPadBottom
  const barW = histW / HIST_BINS
  const gap = 1
  const binW = s.span / HIST_BINS
  return s.counts.map((count: number, i: number) => {
    const h = s.maxCount > 0 ? (count / s.maxCount) * plotH : 0
    const binStart = s.min + i * binW
    const binEnd = binStart + binW
    // A bin that ends at or below buy-in is a loss; above buy-in is a win.
    const below = binEnd <= startBankrollCents.value
    const fill = below ? '#be123c' : '#059669'
    return { x: i * barW + gap / 2, y: plotH - h, w: barW - gap, h, fill }
  })
})

const startHistX = computed(() => {
  const s = histStats.value
  if (!s) return 0
  const frac = (startBankrollCents.value - s.min) / s.span
  const clamped = Math.max(0, Math.min(1, frac))
  return clamped * histW
})

const histAriaLabel = computed(() => {
  if (!result.value) return 'Outcome histogram'
  return `Histogram of final bankrolls across ${result.value.trials} sessions. ${pctBelow.value.toFixed(1)} percent finished below the ${formatCents(startBankrollCents.value)} buy-in.`
})
</script>
