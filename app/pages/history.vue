<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-auto">
    <header class="py-3 border-b border-neutral-800">
      <div class="flex items-center justify-between gap-3 max-w-3xl mx-auto w-full px-4">
        <h1 class="text-lg font-semibold text-neutral-100">
          Session history
        </h1>
        <UButton
          size="sm"
          color="primary"
          variant="soft"
          :disabled="store.sessionLog.length === 0"
          aria-label="Download session as CSV"
          @click="handleDownload"
        >
          Download CSV
        </UButton>
      </div>
      <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto w-full px-4">
        <div class="rounded-lg bg-neutral-900/70 border border-neutral-800 px-3 py-2">
          <div class="text-xs text-neutral-400">
            Spins
          </div>
          <div class="font-mono text-lg text-neutral-100">
            {{ store.sessionStats.spins }}
          </div>
        </div>
        <div class="rounded-lg bg-neutral-900/70 border border-neutral-800 px-3 py-2">
          <div class="text-xs text-neutral-400">
            Wagered
          </div>
          <div class="font-mono text-lg text-neutral-100">
            {{ formatCents(store.sessionStats.wageredCents) }}
          </div>
        </div>
        <div class="rounded-lg bg-neutral-900/70 border border-neutral-800 px-3 py-2">
          <div class="text-xs text-neutral-400">
            Net P&amp;L
          </div>
          <div
            class="font-mono text-lg"
            :class="store.sessionStats.netCents >= 0 ? 'text-emerald-400' : 'text-rose-400'"
          >
            {{ formatSignedCents(store.sessionStats.netCents) }}
          </div>
        </div>
        <div class="rounded-lg bg-neutral-900/70 border border-neutral-800 px-3 py-2">
          <div class="text-xs text-neutral-400">
            Bankroll
          </div>
          <div
            class="font-mono text-lg"
            :style="{ color: 'var(--cream)' }"
          >
            {{ formatCents(store.bankrollCents) }}
          </div>
        </div>
      </div>
    </header>

    <div class="p-4 max-w-3xl mx-auto w-full">
      <p
        v-if="store.spinHistory.length === 0"
        class="text-sm text-neutral-400"
      >
        No spins yet. Head to the table and give the wheel a turn.
      </p>
      <ul
        v-else
        class="flex flex-col gap-1"
      >
        <li
          v-for="(s, i) in store.spinHistory"
          :key="i"
          class="flex items-center justify-between rounded-md bg-neutral-900/50 border border-neutral-800 px-3 py-1.5"
        >
          <div class="flex items-center gap-3">
            <span class="text-xs text-neutral-400 w-6 tabular-nums">#{{ store.spinHistory.length - i }}</span>
            <span
              class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
              :style="{ background: bg(s.pocket) }"
            >{{ s.pocket }}</span>
            <span class="text-xs text-neutral-400 uppercase">{{ colorOf(s.pocket) }}</span>
          </div>
          <span
            class="font-mono text-sm"
            :class="s.netCents > 0 ? 'text-emerald-400' : s.netCents < 0 ? 'text-rose-400' : 'text-neutral-400'"
          >{{ formatSignedCents(s.netCents) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatCents, formatSignedCents } from '~/utils/format'
import { colorOf, type Pocket } from '~/engine/wheel'
import { sessionToCsv } from '~/utils/sessionCsv'
import { downloadText } from '~/utils/download'

const store = useRouletteStore()
const COLORS: Record<string, string> = { red: 'var(--chip-red)', black: '#262626', green: 'var(--chip-green)' }
const bg = (p: Pocket) => COLORS[colorOf(p)]!

function handleDownload() {
  downloadText('roulette-session.csv', sessionToCsv(store.sessionLog))
}

onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) navigateTo('/')
})
</script>
