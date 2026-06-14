<template>
  <div class="flex flex-col items-center gap-3">
    <div
      v-if="latest !== null"
      class="flex items-center gap-3"
    >
      <span
        class="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
        :style="{ background: bg(latest) }"
      >{{ latest }}</span>
      <span
        class="font-mono text-lg"
        :style="{ color: 'var(--cream)' }"
      >{{ colorOf(latest).toUpperCase() }}</span>
    </div>
    <div
      v-if="recent.length > 0"
      class="flex flex-col items-center gap-1"
    >
      <span class="text-[10px] uppercase tracking-wide text-neutral-400">Previous spins</span>
      <div class="flex gap-1 flex-wrap justify-center max-w-md">
        <span
          v-for="(h, i) in recent"
          :key="i"
          class="w-6 h-6 rounded text-[11px] font-semibold text-white flex items-center justify-center"
          :style="{ background: bg(h) }"
        >{{ h }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { colorOf, type Pocket } from '~/engine/wheel'

const props = defineProps<{ latest: Pocket | null, history: Pocket[] }>()
const COLORS: Record<string, string> = { red: 'var(--chip-red)', black: '#262626', green: 'var(--chip-green)' }
const bg = (p: Pocket) => COLORS[colorOf(p)]!

// The strip is the recent-results scoreboard. When a number is showing big above
// (history[0] === latest), drop it from the strip so the current result isn't
// duplicated and mistaken for part of the strip — these are PRIOR spins only.
const recent = computed(() => (props.latest !== null ? props.history.slice(1) : props.history))
</script>
