<template>
  <section
    aria-labelledby="bet-ev-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2
        id="bet-ev-heading"
        class="text-sm font-semibold text-neutral-200"
      >
        Expected value of every bet
      </h2>

      <!-- Variant toggle -->
      <div
        class="inline-flex rounded-md border border-neutral-700 overflow-hidden text-xs"
        role="group"
        aria-label="Wheel variant"
      >
        <button
          class="px-3 py-1.5 font-medium transition-colors cursor-pointer"
          :class="variant === 'single'
            ? 'bg-amber-600 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'"
          :aria-pressed="variant === 'single'"
          @click="variant = 'single'"
        >
          Single-zero
        </button>
        <button
          class="px-3 py-1.5 font-medium transition-colors cursor-pointer"
          :class="variant === 'double'
            ? 'bg-amber-600 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'"
          :aria-pressed="variant === 'double'"
          @click="variant = 'double'"
        >
          Double-zero
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-neutral-800 text-left">
            <th class="py-2 pr-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
              Bet
            </th>
            <th class="py-2 px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right">
              Pays
            </th>
            <th class="py-2 px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right">
              Numbers
            </th>
            <th class="py-2 px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right">
              Win chance
            </th>
            <th class="py-2 pl-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right">
              House edge
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b border-neutral-800/60 last:border-0"
            :class="{ 'bg-rose-950/30': row.outlier }"
          >
            <td class="py-2.5 pr-3 text-neutral-200">
              {{ row.label }}
            </td>
            <td class="py-2.5 px-3 text-right font-mono text-neutral-300">
              {{ row.pays }}:1
            </td>
            <td class="py-2.5 px-3 text-right font-mono text-neutral-300">
              {{ row.covered }}
            </td>
            <td class="py-2.5 px-3 text-right font-mono text-neutral-300">
              {{ row.winChance.toFixed(1) }}%
            </td>
            <td
              class="py-2.5 pl-3 text-right font-mono font-semibold"
              :class="row.outlier ? 'text-rose-400' : 'text-rose-300'"
            >
              {{ row.edge.toFixed(2) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-[11px] text-neutral-400 leading-snug">
      Look down the edge column: <span class="text-neutral-200">every bet carries the same house edge</span> —
      {{ baselineEdge.toFixed(2) }}% on this wheel. Spreading chips across more numbers lowers the payout in
      exact lockstep, so the house keeps the same cut no matter what you back.
      <template v-if="variant === 'double'">
        The lone exception is the <span class="text-rose-300">First Five</span> on the American wheel
        (7.89%) — the single worst bet in the casino.
      </template>
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Variant } from '~/engine/wheel'
import { pocketCount } from '~/engine/wheel'
import { type Bet, type BetType, PAYOUTS, COLUMNS, DOZENS, coverage } from '~/engine/bets'
import { edgePct } from '~/engine/ev'

const variant = ref<Variant>('single')

const BASE_STAKE = 100

// One representative bet per BetType, built from the engine's own helpers.
interface BetDef { id: BetType, label: string, numbers: (number | '00')[] }

const baseBets: BetDef[] = [
  { id: 'straight', label: 'Straight up', numbers: [7] },
  { id: 'split', label: 'Split', numbers: [7, 8] },
  { id: 'street', label: 'Street', numbers: [7, 8, 9] },
  { id: 'corner', label: 'Corner', numbers: [7, 8, 10, 11] },
  { id: 'sixline', label: 'Six line', numbers: [7, 8, 9, 10, 11, 12] },
  { id: 'column', label: 'Column', numbers: COLUMNS[0]! },
  { id: 'dozen', label: 'Dozen', numbers: DOZENS[0]! },
  { id: 'red', label: 'Even money (red)', numbers: [] }
]

const firstFive: BetDef = { id: 'firstFive', label: 'First Five (0-00-1-2-3)', numbers: [0, '00', 1, 2, 3] }

const rows = computed(() => {
  const defs = variant.value === 'double' ? [...baseBets, firstFive] : baseBets
  const pockets = pocketCount(variant.value)

  return defs.map((def) => {
    const bet: Bet = { type: def.id, numbers: def.numbers, stakeCents: BASE_STAKE }
    const covered = coverage(bet).size
    const edge = edgePct(bet, { variant: variant.value, evenMoney: 'none' })
    return {
      id: def.id,
      label: def.label,
      pays: PAYOUTS[def.id],
      covered,
      winChance: (covered / pockets) * 100,
      edge,
      outlier: def.id === 'firstFive'
    }
  })
})

// The shared baseline edge — straight-up edge equals the standard house edge for the variant.
const baselineEdge = computed(() =>
  edgePct({ type: 'straight', numbers: [7], stakeCents: BASE_STAKE }, { variant: variant.value, evenMoney: 'none' })
)
</script>
