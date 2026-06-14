<template>
  <Transition name="flash">
    <div
      v-if="store.flash"
      class="flash-toast"
      :class="'flash-' + store.flash.tone"
      role="status"
      aria-live="polite"
      @click="store.dismissFlash()"
    >
      <UIcon
        :name="icon"
        class="w-4 h-4 shrink-0"
      />
      <span>{{ store.flash.text }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouletteStore } from '~/stores/roulette'

const store = useRouletteStore()

const ICONS: Record<string, string> = {
  error: 'i-lucide-circle-alert',
  info: 'i-lucide-info',
  win: 'i-lucide-party-popper',
  loss: 'i-lucide-trending-down',
  neutral: 'i-lucide-circle-dot'
}
const icon = computed(() => ICONS[store.flash?.tone ?? 'info'] ?? 'i-lucide-info')
</script>

<style scoped>
.flash-toast {
  position: fixed;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  max-width: 90vw;
  white-space: nowrap;
}

.flash-error {
  background: #e11d48;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.flash-info {
  background: #1f2937;
  color: #f3f4f6;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.flash-win {
  background: #16a34a;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.flash-loss {
  background: #be123c;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.flash-neutral {
  background: #334155;
  color: #f1f5f9;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

.flash-enter-to,
.flash-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
