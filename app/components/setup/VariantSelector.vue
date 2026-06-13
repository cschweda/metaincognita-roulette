<template>
  <div>
    <h3 class="text-sm font-semibold text-neutral-300 mb-3">
      Choose your table
    </h3>
    <div class="grid sm:grid-cols-2 gap-3">
      <button
        v-for="p in presets"
        :key="p.id"
        type="button"
        class="text-left rounded-xl border p-4 transition"
        :class="modelValue === p.id ? 'border-primary-500 bg-primary-500/10' : 'border-neutral-800 hover:border-neutral-700'"
        @click="$emit('update:modelValue', p.id)"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-neutral-100">{{ p.label }}</span>
          <span class="font-mono text-sm text-primary-400">{{ p.edgePct.toFixed(2) }}%</span>
        </div>
        <p class="text-xs text-neutral-400 mt-1">
          {{ p.blurb }}
        </p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { rouletteConfig } from '../../../roulette.config'

defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [string] }>()
const presets = rouletteConfig.presets
</script>
