<template>
  <div class="bet-controls">
    <span class="staked-readout">
      Staked: <span class="staked-amount">{{ formatCents(totalStaked) }}</span>
    </span>
    <div class="controls-row">
      <UButton
        color="primary"
        size="lg"
        :loading="spinning"
        :disabled="spinning || totalStaked === 0"
        @click="emit('spin')"
      >
        {{ spinning ? 'Spinning…' : 'Spin' }}
      </UButton>
      <UButton
        variant="outline"
        size="lg"
        :disabled="spinning || totalStaked === 0"
        @click="emit('clear')"
      >
        Clear
      </UButton>
      <UButton
        variant="ghost"
        size="lg"
        :disabled="spinning || !canRepeat"
        @click="emit('repeat')"
      >
        Repeat
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCents } from '~/utils/format'

defineProps<{
  spinning: boolean
  totalStaked: number
  canRepeat: boolean
}>()

const emit = defineEmits<{
  spin: []
  clear: []
  repeat: []
}>()
</script>

<style scoped>
.bet-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 4px 0 8px;
}

.staked-readout {
  font-size: 13px;
  color: var(--cream, #f5e6c8);
  opacity: 0.75;
}

.staked-amount {
  font-family: var(--font-mono, 'Fira Code', monospace);
  font-weight: 700;
  opacity: 1;
  color: var(--gold, #d4a847);
}

.controls-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
