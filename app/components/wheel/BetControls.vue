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
      <span
        v-if="!spinning && totalStaked > 0"
        class="spin-ready-dot"
        aria-hidden="true"
      />
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
  position: relative;
  min-height: 56px;
  font-size: 18px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spin-ready-dot {
  position: absolute;
  right: 16px;
  top: 50%;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  animation: spin-ready 1.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes spin-ready {
  0%, 100% {
    opacity: 0.25;
    transform: scale(0.85);
  }

  50% {
    opacity: 0.95;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin-ready-dot {
    animation: none;
    opacity: 0.7;
  }
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
