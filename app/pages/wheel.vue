<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div
      v-if="store.storageWarning"
      class="bg-amber-500/15 text-amber-300 text-xs px-3 py-1 text-center"
    >
      Storage is full — playing in memory only; this session won't be saved.
    </div>
    <header class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
      <div class="text-sm text-neutral-300">
        {{ store.playerName }}
      </div>
      <div
        class="font-mono text-lg"
        :style="{ color: 'var(--cream)' }"
      >
        {{ formatCents(store.bankrollCents) }}
      </div>
      <div class="text-xs text-neutral-400">
        {{ store.preset.label }} · <span class="font-mono text-primary-400">{{ store.preset.edgePct.toFixed(2) }}%</span>
      </div>
    </header>
    <div
      class="flex-1 flex flex-col items-center justify-center gap-5 py-4"
      :style="{ background: 'var(--felt-dark)' }"
    >
      <RouletteWheel
        ref="wheelRef"
        :variant="store.variant"
        :reduced-motion="reducedMotion"
        :size="460"
      />
      <ResultBadge
        :latest="store.revealPocket"
        :history="historyPockets"
      />
      <UButton
        color="primary"
        size="lg"
        :loading="store.phase === 'spinning'"
        :disabled="store.phase === 'spinning'"
        @click="spin"
      >
        {{ store.phase === 'spinning' ? 'Spinning…' : 'Spin' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatCents } from '~/utils/format'
import type { Pocket } from '~/engine/wheel'

const store = useRouletteStore()
const wheelRef = ref<{ spinTo: (p: Pocket) => Promise<void> } | null>(null)
const reducedMotion = ref(false)
const historyPockets = computed(() => store.spinHistory.map(s => s.pocket))

onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) {
    navigateTo('/')
    return
  }
  reducedMotion.value = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

async function spin() {
  if (store.phase === 'spinning' || !wheelRef.value) return
  const result = store.computeSpin() // engine decides (source of truth)
  await wheelRef.value.spinTo(result.pocket) // wheel replays it; resolves at rest
  store.commitSpin(result) // reveal now, paced with the animation
  store.readyForNextSpin()
}
</script>
