<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-auto">
    <header class="px-4 py-3 border-b border-neutral-800">
      <div>
        <h1 class="text-lg font-semibold text-neutral-100">
          Analysis
        </h1>
        <p class="text-xs text-neutral-400 mt-1">
          The math behind every bet — and proof that no system beats it.
        </p>
      </div>
    </header>
    <div class="p-4 flex flex-col gap-6 max-w-3xl">
      <AnalysisEdgeTable />
      <AnalysisBetEvTable />
      <AnalysisSystemSimulator />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'

const store = useRouletteStore()

onMounted(() => {
  // Analysis is a standalone destination — usable without an active session.
  // Load one if it exists, but never force a redirect.
  if (store.phase === 'setup') store.loadFromLocalStorage()
})
</script>
