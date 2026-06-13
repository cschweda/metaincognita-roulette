<script setup lang="ts">
import { rouletteConfig } from '../../../roulette.config'
import { formatCents } from '~/utils/format'

defineProps<{
  stakeId: string
}>()

const emit = defineEmits<{
  'update:stakeId': [value: string]
}>()

const stakes = rouletteConfig.stakes
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-primary-400 tracking-wide uppercase">
      Table Stakes
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        v-for="stake in stakes"
        :key="stake.id"
        class="relative rounded-xl p-4 text-left transition-all duration-200 cursor-pointer border-2"
        :class="[
          stakeId === stake.id
            ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
            : 'border-neutral-700 bg-neutral-800/60 hover:border-neutral-500 hover:bg-neutral-800'
        ]"
        @click="emit('update:stakeId', stake.id)"
      >
        <div
          class="font-bold text-sm mb-2"
          :class="stakeId === stake.id ? 'text-primary-400' : 'text-neutral-200'"
        >
          {{ stake.label }}
        </div>
        <div class="space-y-1 text-xs text-neutral-400">
          <div>
            <span class="text-neutral-400">Bets:</span>
            {{ formatCents(stake.minBetCents) }} – {{ formatCents(stake.maxBetCents) }}
          </div>
          <div>
            <span class="text-neutral-400">Bankroll:</span>
            <span class="text-emerald-400"> {{ formatCents(stake.defaultBankrollCents) }}</span>
          </div>
        </div>

        <div
          v-if="stakeId === stake.id"
          class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary-400"
        />
      </button>
    </div>
  </div>
</template>
