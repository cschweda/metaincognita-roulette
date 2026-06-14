<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-auto">
    <header class="px-4 py-3 border-b border-neutral-800">
      <h1 class="text-lg font-semibold text-neutral-100">
        The Lab
      </h1>
      <p class="text-xs text-neutral-400 mt-1">
        Run the real engine at scale — prove the wheel is fair, or break it on purpose.
      </p>
    </header>
    <div class="p-4 flex flex-col gap-6 max-w-3xl">
      <LabHardcoreStats />
      <LabWheelSandbox />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import { useRouletteStore } from '~/stores/roulette'

const store = useRouletteStore()
onMounted(() => {
  // The Lab is a tool — usable without an active session. Load one if it exists
  // (so the hardcore stats reflect your game), but don't force a redirect.
  if (store.phase === 'setup') store.loadFromLocalStorage()
})
</script>
