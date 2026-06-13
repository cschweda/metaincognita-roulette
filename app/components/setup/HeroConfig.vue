<script setup lang="ts">
import { sanitizeName } from '~/utils/sanitize'
import { formatCents } from '~/utils/format'

const props = defineProps<{
  name: string
  bankrollCents: number
  defaultBankrollCents: number
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:bankrollCents': [value: number]
}>()

const minBankroll = computed(() => Math.round(props.defaultBankrollCents * 0.5))
const maxBankroll = computed(() => props.defaultBankrollCents * 5)

function onNameInput(value: string) {
  emit('update:name', sanitizeName(value))
}

function onBankrollChange(value: number | undefined) {
  if (value !== undefined) emit('update:bankrollCents', value)
}

// Re-clamp bankroll when stake changes
watch(() => props.defaultBankrollCents, () => {
  const clamped = Math.min(Math.max(props.bankrollCents, minBankroll.value), maxBankroll.value)
  if (clamped !== props.bankrollCents) {
    emit('update:bankrollCents', clamped)
  }
})
</script>

<template>
  <div class="space-y-5">
    <h2 class="text-lg font-semibold text-primary-400 tracking-wide uppercase">
      Your Player
    </h2>

    <UFormField label="Name">
      <UInput
        :model-value="name"
        placeholder="Hero"
        maxlength="32"
        icon="i-lucide-user"
        class="w-full"
        @update:model-value="onNameInput($event as string)"
      />
    </UFormField>

    <UFormField label="Buy-in">
      <div class="flex items-center gap-4">
        <USlider
          :model-value="bankrollCents"
          :min="minBankroll"
          :max="maxBankroll"
          :step="defaultBankrollCents >= 100_000 ? 10_000 : defaultBankrollCents >= 10_000 ? 5_000 : 1_000"
          color="primary"
          class="flex-1"
          @update:model-value="onBankrollChange"
        />
        <span class="text-emerald-400 font-mono text-lg min-w-[6rem] text-right">
          {{ formatCents(bankrollCents) }}
        </span>
      </div>
      <p class="text-xs text-neutral-400 mt-1">
        {{ formatCents(minBankroll) }} – {{ formatCents(maxBankroll) }}
      </p>
    </UFormField>
  </div>
</template>
