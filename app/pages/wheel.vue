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
      class="flex-1 flex flex-col items-center justify-center gap-4"
      :style="{ background: 'var(--felt-dark)' }"
    >
      <p class="text-neutral-300/80 text-sm">
        Wheel &amp; betting mat arrive in Plans 2b–2c.
      </p>
      <UButton
        color="primary"
        disabled
      >
        Spin
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatCents } from '~/utils/format'

const store = useRouletteStore()
onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) navigateTo('/')
})
</script>
