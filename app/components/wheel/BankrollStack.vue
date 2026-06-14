<script setup lang="ts">
import { computed } from 'vue'
import { formatCents } from '~/utils/format'

const props = defineProps<{ bankrollCents: number, startingCents: number }>()
const unit = computed(() => Math.max(Math.round(props.startingCents / 20), 100))
const discs = computed(() => Math.max(0, Math.min(24, Math.round(props.bankrollCents / unit.value))))
const overflow = computed(() => Math.max(0, Math.round(props.bankrollCents / unit.value) - 24))
const palette = ['#c1272d', '#1b7a43', '#1a1a1a', '#6d28d9']
</script>

<template>
  <div
    class="flex flex-col items-center gap-1"
    role="img"
    :aria-label="'Bankroll ' + formatCents(bankrollCents)"
  >
    <div
      v-if="overflow > 0"
      class="text-[10px] font-mono text-neutral-400"
    >
      ×{{ overflow + 24 }} units
    </div>
    <div
      class="flex flex-col-reverse items-center"
      style="min-height: 2px"
    >
      <div
        v-for="i in discs"
        :key="i"
        data-chip
        class="rounded-[3px] border border-black/30"
        :style="{ width: '34px', height: '5px', marginTop: '-1px', background: palette[i % palette.length], boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }"
      />
    </div>
    <div
      class="font-mono text-xs"
      :style="{ color: 'var(--cream)' }"
    >
      {{ formatCents(bankrollCents) }}
    </div>
  </div>
</template>
