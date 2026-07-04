<template>
  <div class="w-full rounded-xl bg-neutral-900/70 border border-neutral-800 px-4 py-3">
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="text-[11px] uppercase tracking-wide text-neutral-400">Last spin</span>
      <span
        v-if="result"
        class="text-[11px] font-bold px-2 py-0.5 rounded text-white shrink-0"
        :style="{ background: pocketColor }"
      >{{ result.pocket }} {{ colorOf(result.pocket).toUpperCase() }}</span>
    </div>
    <div
      v-if="!result"
      class="text-[12px] text-neutral-400"
    >
      Spin to see which of your bets won and lost.
    </div>
    <ul
      v-else
      class="flex flex-col gap-1 max-h-[84px] overflow-y-auto pr-0.5"
    >
      <li
        v-for="(p, i) in result.perBet"
        :key="i"
        class="flex items-center gap-2 text-[12px]"
      >
        <UIcon
          :name="p.won ? 'i-lucide-check' : 'i-lucide-x'"
          :class="p.won ? 'text-emerald-400' : 'text-rose-400'"
          class="w-3.5 h-3.5 shrink-0"
        />
        <span class="text-neutral-200 flex-1 min-w-0 truncate">{{ betLabel(p.bet) }}</span>
        <span
          class="font-mono shrink-0"
          :class="outcomeClass(p)"
        >{{ outcomeText(p) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { colorOf } from '~/engine/wheel'
import { betLabel } from '~/utils/betLabel'
import { formatSignedCents } from '~/utils/format'
import type { PerBetResult } from '~/engine/round'

const store = useRouletteStore()
const result = computed(() => store.lastRoundResult)

const COLORS: Record<string, string> = { red: 'var(--chip-red)', black: '#262626', green: 'var(--chip-green)' }
const pocketColor = computed(() => (result.value ? COLORS[colorOf(result.value.pocket)] ?? '#262626' : '#262626'))

function outcomeText(p: PerBetResult): string {
  if (p.won) return formatSignedCents(p.returnCents - p.bet.stakeCents)
  if (p.returnCents > 0) return '½ back'
  return formatSignedCents(-p.bet.stakeCents)
}
function outcomeClass(p: PerBetResult): string {
  if (p.won) return 'text-emerald-400'
  if (p.returnCents > 0) return 'text-amber-400'
  return 'text-rose-400'
}
</script>
