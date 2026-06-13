<script setup lang="ts">
import { rouletteConfig } from '~~/roulette.config'
import { useRouletteStore } from '~/stores/roulette'

const store = useRouletteStore()

// State
const name = ref('Hero')
const presetId = ref(rouletteConfig.defaultPresetId)
const stakeId = ref(rouletteConfig.stakes[0]!.id)

const selectedStake = computed(
  () => rouletteConfig.stakes.find(s => s.id === stakeId.value) ?? rouletteConfig.stakes[0]!
)

const bankrollCents = ref(selectedStake.value.defaultBankrollCents)

// When stake changes, prefill bankroll to tier default
watch(stakeId, () => {
  bankrollCents.value = selectedStake.value.defaultBankrollCents
})

// Validation
const canStart = computed(() => name.value.trim().length > 0 && bankrollCents.value > 0)

// Resume banner
const hasResume = ref(false)

onMounted(() => {
  if (store.loadFromLocalStorage()) {
    hasResume.value = true
  }
})

async function startGame() {
  if (!canStart.value) return
  store.initializeGame({
    presetId: presetId.value,
    playerName: name.value.trim(),
    bankrollCents: bankrollCents.value,
    selectedChipCents: rouletteConfig.chips[0]!,
  })
  await navigateTo('/wheel')
}

async function resumeSession() {
  await navigateTo('/wheel')
}
</script>

<template>
  <div class="flex-1 bg-neutral-950 flex items-start justify-center px-4 py-10 overflow-y-auto">
    <div class="w-full max-w-[800px] space-y-8">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h1 class="text-4xl font-bold tracking-tight">
          <span class="text-primary-400">Roulette</span>
          <span class="text-neutral-300"> Trainer</span>
        </h1>
        <p class="text-neutral-500 text-sm">
          Pick your table rules, choose your stakes, and take your seat.
        </p>
      </div>

      <!-- Main card -->
      <div class="rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-2xl shadow-black/40 p-6 sm:p-8 space-y-8">
        <!-- Resume banner -->
        <div
          v-if="hasResume"
          class="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span class="text-sm text-emerald-300 font-medium">Session saved — pick up where you left off.</span>
          </div>
          <UButton
            size="sm"
            variant="outline"
            color="success"
            label="Resume session"
            icon="i-lucide-play"
            @click="resumeSession"
          />
        </div>

        <!-- Hero Config -->
        <SetupHeroConfig
          v-model:name="name"
          v-model:bankroll-cents="bankrollCents"
          :default-bankroll-cents="selectedStake.defaultBankrollCents"
        />

        <div class="border-t border-neutral-800" />

        <!-- Variant / Table Selector -->
        <SetupVariantSelector v-model="presetId" />

        <div class="border-t border-neutral-800" />

        <!-- Stake Selector -->
        <SetupStakeSelector v-model:stake-id="stakeId" />

        <div class="border-t border-neutral-800" />

        <!-- Start Button -->
        <UButton
          size="xl"
          block
          :disabled="!canStart"
          icon="i-lucide-armchair"
          label="Take a seat"
          class="font-bold tracking-wide"
          @click="startGame"
        />
      </div>

      <!-- Footer note -->
      <p class="text-center text-neutral-600 text-xs">
        All amounts are for simulation purposes only. No real money is involved.
      </p>
    </div>
  </div>
</template>
