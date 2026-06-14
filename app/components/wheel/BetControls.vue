<template>
  <div class="bet-controls">
    <span class="staked-readout">
      Staked: <span class="staked-amount">{{ formatCents(totalStaked) }}</span>
    </span>
    <UButton
      color="primary"
      size="xl"
      block
      class="spin-btn"
      :loading="spinning"
      :disabled="spinning"
      @click="emit('spin')"
    >
      {{ spinning ? 'Spinning…' : 'Spin' }}
    </UButton>
    <div class="controls-row">
      <UButton
        class="ctl-btn"
        color="neutral"
        variant="outline"
        size="md"
        :disabled="spinning || totalStaked === 0"
        @click="emit('clear')"
      >
        Clear
      </UButton>
      <UButton
        class="ctl-btn"
        color="primary"
        variant="soft"
        size="md"
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
  width: 100%;
  max-width: 340px;
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

.spin-btn {
  min-height: 56px;
  font-size: 18px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.controls-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.ctl-btn {
  flex: 1;
  justify-content: center;
}
</style>
