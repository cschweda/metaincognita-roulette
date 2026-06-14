<template>
  <div class="w-full rounded-xl bg-neutral-900/70 border border-neutral-800 px-4 py-3">
    <div class="flex items-center gap-1.5 mb-2">
      <span
        class="i-lucide-trending-down text-neutral-400 text-[14px] shrink-0"
        aria-hidden="true"
      />
      <span class="text-[11px] uppercase tracking-wide text-neutral-400">Expected value</span>
    </div>
    <template v-if="store.bets.length > 0">
      <ul class="text-[12px] text-neutral-300 leading-snug mb-1.5 max-h-[72px] overflow-y-auto space-y-0.5">
        <li
          v-for="(bet, i) in store.bets"
          :key="`${bet.type}-${bet.numbers.join('_')}-${i}`"
        >
          {{ betMeaning(bet, store.variant) }}
        </li>
      </ul>
      <div class="text-[12px] text-neutral-300 leading-snug">
        The house keeps
        <span class="font-mono text-rose-400 font-semibold">{{ formatCents(Math.round(-evCents)) }}</span>
        of your <span class="font-mono">{{ formatCents(totalStakeCents) }}</span>
        <span class="text-neutral-400">({{ lossPct }}%)</span>.
      </div>
    </template>
    <template v-else>
      <div class="text-[11px] text-neutral-400 mb-1">
        House edge: <span class="font-mono text-neutral-300">{{ store.preset.edgePct.toFixed(2) }}%</span>
      </div>
      <div class="text-[12px] text-neutral-400">
        Place a bet to see what it pays and its expected cost.
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { combinedEvCents } from '~/engine/ev'
import { formatCents } from '~/utils/format'
import { betMeaning } from '~/utils/betLabel'

const store = useRouletteStore()

const totalStakeCents = computed(() => store.totalStakedCents)
const evCents = computed(() => combinedEvCents(store.bets, store.rules))
const lossPct = computed(() => {
  if (totalStakeCents.value === 0) return '0.00'
  return ((-evCents.value / totalStakeCents.value) * 100).toFixed(2)
})
</script>
