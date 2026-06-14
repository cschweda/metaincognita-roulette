<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div
      v-if="store.storageWarning"
      class="bg-amber-500/15 text-amber-300 text-xs px-3 py-1 text-center"
    >
      Storage is full — playing in memory only; this session won't be saved.
    </div>
    <header class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
      <div class="text-sm text-neutral-300">
        {{ store.playerName }}
      </div>
      <div
        class="font-mono text-lg"
        :style="{ color: 'var(--cream)' }"
      >
        {{ formatCents(store.bankrollCents) }}
      </div>
      <div class="text-xs text-neutral-400">
        {{ store.preset.label }} · <span class="font-mono text-primary-400">{{ store.preset.edgePct.toFixed(2) }}%</span>
      </div>
    </header>
    <div
      class="flex-1 flex flex-col lg:flex-row items-center lg:justify-center gap-6 p-4 overflow-auto"
      :style="{ background: 'var(--felt-dark)' }"
    >
      <!-- Left: the wheel + result -->
      <div class="flex flex-col items-center gap-3 shrink-0">
        <RouletteWheel
          ref="wheelRef"
          :variant="store.variant"
          :reduced-motion="reducedMotion"
          :size="380"
        />
        <ResultBadge
          :latest="store.revealPocket"
          :history="historyPockets"
        />
        <div
          v-if="lastNet !== null && store.phase !== 'spinning'"
          class="win-loss-banner"
          :class="lastNet > 0 ? 'banner-win' : 'banner-neutral'"
        >
          <template v-if="lastNet > 0">
            Won {{ formatCents(lastNet) }}
          </template>
          <template v-else>
            {{ lastNet < 0 ? 'Lost ' + formatCents(-lastNet) : 'No win' }}
          </template>
        </div>
        <StatsPanel />
      </div>

      <!-- Right: the betting layout -->
      <div class="flex flex-col items-center gap-4">
        <RouletteMat
          :variant="store.variant"
          :bets="store.bets"
          @place="onPlace"
        />
        <ChipTray
          :selected="store.selectedChipCents"
          @select="store.setSelectedChip"
          @dragstart="(p) => dragStart(p.cents, p.ev)"
        />
        <BetControls
          :spinning="store.phase === 'spinning'"
          :total-staked="store.totalStakedCents"
          :can-repeat="store.lastRoundBets.length > 0"
          @spin="spin"
          @clear="store.clearBets"
          @repeat="store.repeatLastBet"
        />
      </div>
    </div>
    <div
      v-if="dragActive"
      class="fixed z-50 pointer-events-none w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-white/70 flex items-center justify-center text-xs font-bold text-white shadow-lg"
      :style="{ left: dragX + 'px', top: dragY + 'px', background: 'var(--chip-red)' }"
    >
      {{ formatCents(dragChipCents) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatCents } from '~/utils/format'
import type { Pocket } from '~/engine/wheel'
import type { BetType } from '~/engine/bets'
import RouletteWheel from '~/components/wheel/RouletteWheel.vue'
import ResultBadge from '~/components/wheel/ResultBadge.vue'
import RouletteMat from '~/components/wheel/RouletteMat.vue'
import ChipTray from '~/components/wheel/ChipTray.vue'
import BetControls from '~/components/wheel/BetControls.vue'
import StatsPanel from '~/components/wheel/StatsPanel.vue'

const store = useRouletteStore()
const { dragging: dragActive, chipCents: dragChipCents, x: dragX, y: dragY, start: dragStart } = useChipDrag((descriptor, cents) => {
  lastNet.value = null
  store.placeBet(descriptor, cents)
})
const wheelRef = ref<{ spinTo: (p: Pocket) => Promise<void> } | null>(null)
const reducedMotion = ref(false)
const historyPockets = computed(() => store.spinHistory.map(s => s.pocket))
const lastNet = ref<number | null>(null)

onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) {
    navigateTo('/')
    return
  }
  reducedMotion.value = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function onPlace(descriptor: { type: BetType, numbers: Pocket[] }) {
  lastNet.value = null
  store.placeBet(descriptor, store.selectedChipCents)
}

async function spin() {
  if (store.phase === 'spinning' || store.totalStakedCents === 0 || !wheelRef.value) return
  const result = store.computeSpin()
  await wheelRef.value.spinTo(result.pocket)
  store.commitSpin(result)
  lastNet.value = result.netCents
  store.readyForNextSpin()
}
</script>

<style scoped>
.win-loss-banner {
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-mono, 'Fira Code', monospace);
  padding: 6px 20px;
  border-radius: 6px;
  letter-spacing: 0.03em;
}

.banner-win {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.banner-neutral {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
</style>
