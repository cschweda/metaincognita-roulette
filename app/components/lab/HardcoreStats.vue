<template>
  <section
    aria-labelledby="hardcore-stats-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4"
  >
    <h2
      id="hardcore-stats-heading"
      class="text-sm font-semibold text-neutral-200"
    >
      Session — the hard numbers
    </h2>

    <!-- Core counters -->
    <dl class="grid grid-cols-3 gap-3 font-mono text-center">
      <div class="rounded bg-neutral-800/60 px-2 py-2">
        <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
          Spins
        </dt>
        <dd class="text-base text-neutral-100">
          {{ store.sessionStats.spins }}
        </dd>
      </div>
      <div class="rounded bg-neutral-800/60 px-2 py-2">
        <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
          Wagered
        </dt>
        <dd class="text-base text-neutral-100">
          {{ formatCents(store.sessionStats.wageredCents) }}
        </dd>
      </div>
      <div class="rounded bg-neutral-800/60 px-2 py-2">
        <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
          Net
        </dt>
        <dd
          class="text-base"
          :class="store.sessionStats.netCents >= 0 ? 'text-emerald-400' : 'text-rose-400'"
        >
          {{ formatSignedCents(store.sessionStats.netCents) }}
        </dd>
      </div>
    </dl>

    <!-- Edge comparison -->
    <div class="rounded bg-neutral-800/40 px-3 py-2.5 space-y-1.5">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm">
        <span>
          <span class="text-[10px] uppercase tracking-widest text-neutral-500 mr-1.5">measurement</span>
          <span
            class="font-semibold"
            :class="realizedEdgeFraction >= 0 ? 'text-rose-300' : 'text-emerald-300'"
          >{{ formatPercent(Math.abs(realizedEdgeFraction)) }}</span>
          <span
            v-if="realizedEdgeFraction < 0"
            class="text-[10px] text-emerald-500 ml-1"
          >(player ahead)</span>
        </span>
        <span>
          <span class="text-[10px] uppercase tracking-widest text-neutral-500 mr-1.5">model</span>
          <span class="font-semibold text-neutral-300">{{ formatPercent(store.preset.edgePct / 100) }}</span>
        </span>
      </div>
      <p
        v-if="store.sessionStats.spins > 0"
        class="text-[11px] text-neutral-400 leading-snug"
      >
        You're running at <span class="text-neutral-200">{{ formatPercent(Math.abs(realizedEdgeFraction)) }}</span> vs the model's <span class="text-neutral-200">{{ formatPercent(store.preset.edgePct / 100) }}</span> — the gap is variance, and it shrinks with volume.
      </p>
      <p
        v-else
        class="text-[11px] text-neutral-500"
      >
        No spins yet — make some bets to see your realized edge.
      </p>
    </div>

    <!-- Best / worst -->
    <dl class="grid grid-cols-2 gap-3 font-mono text-center">
      <div class="rounded bg-neutral-800/60 px-2 py-2">
        <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
          Biggest win
        </dt>
        <dd
          class="text-base"
          :class="biggestWin !== null ? 'text-emerald-400' : 'text-neutral-500'"
        >
          {{ biggestWin !== null ? formatSignedCents(biggestWin) : '—' }}
        </dd>
      </div>
      <div class="rounded bg-neutral-800/60 px-2 py-2">
        <dt class="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
          Worst loss
        </dt>
        <dd
          class="text-base"
          :class="worstLoss !== null ? 'text-rose-400' : 'text-neutral-500'"
        >
          {{ worstLoss !== null ? formatSignedCents(worstLoss) : '—' }}
        </dd>
      </div>
    </dl>

    <!-- Hot / cold pockets -->
    <div>
      <h3 class="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
        Hot pockets (top 5)
      </h3>
      <div
        v-if="topPockets.length === 0"
        class="text-[11px] text-neutral-500"
      >
        No spin history yet.
      </div>
      <div
        v-else-if="store.spinHistory.length < 10"
        class="text-[11px] text-neutral-500 mb-2"
      >
        Only {{ store.spinHistory.length }} spin{{ store.spinHistory.length === 1 ? '' : 's' }} — counts are too small to be meaningful.
      </div>
      <ul
        v-if="topPockets.length > 0"
        class="flex flex-wrap gap-2"
        aria-label="Hot pockets by frequency"
      >
        <li
          v-for="pc in topPockets"
          :key="String(pc.pocket)"
          class="flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs font-semibold"
          :class="pocketChipClass(pc.pocket)"
        >
          <span>{{ pc.pocket }}</span>
          <span class="text-[10px] font-normal opacity-75">×{{ pc.count }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { colorOf, type Pocket } from '~/engine/wheel'
import { formatCents, formatSignedCents, formatPercent } from '~/utils/format'
import { realizedEdge, pocketCounts } from './labStats'

const store = useRouletteStore()

const realizedEdgeFraction = computed(() =>
  realizedEdge(store.sessionStats.netCents, store.sessionStats.wageredCents)
)

const biggestWin = computed<number | null>(() => {
  if (store.spinHistory.length === 0) return null
  const max = Math.max(...store.spinHistory.map(s => s.netCents))
  return max > 0 ? max : null
})

const worstLoss = computed<number | null>(() => {
  if (store.spinHistory.length === 0) return null
  const min = Math.min(...store.spinHistory.map(s => s.netCents))
  return min < 0 ? min : null
})

const topPockets = computed(() => pocketCounts(store.spinHistory).slice(0, 5))

function pocketChipClass(pocket: Pocket): string {
  const color = colorOf(pocket)
  if (color === 'red') return 'bg-rose-700/80 text-rose-100 ring-1 ring-rose-600/50'
  if (color === 'black') return 'bg-neutral-700 text-neutral-100 ring-1 ring-neutral-600/50'
  return 'bg-emerald-800/80 text-emerald-100 ring-1 ring-emerald-600/50'
}
</script>
