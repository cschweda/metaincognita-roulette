<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div
      v-if="store.storageWarning"
      class="bg-amber-500/15 text-amber-300 text-xs px-3 py-1 text-center"
    >
      Storage is full — playing in memory only; this session won't be saved.
    </div>
    <header class="flex items-center justify-between gap-3 px-4 py-2 border-b border-neutral-800">
      <div class="text-sm text-neutral-300 flex-1 min-w-0 truncate">
        {{ store.playerName }}
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span
          class="font-mono text-lg"
          :style="{ color: 'var(--cream)' }"
        >
          {{ formatCents(store.bankrollCents) }}
        </span>
        <MiniSparkline class="hidden sm:block" />
        <span
          class="result-pill"
          :class="'tone-' + resultTone"
          :aria-live="resultTone === 'none' ? 'off' : 'polite'"
        >{{ resultText }}</span>
      </div>
      <div class="flex-1 min-w-0 flex items-center justify-end gap-2">
        <span class="text-xs text-neutral-400 truncate">{{ store.preset.label }} · <span class="font-mono text-primary-400">{{ store.preset.edgePct.toFixed(2) }}%</span></span>
        <button
          type="button"
          class="speed-toggle"
          :title="`Spin speed: ${store.spinSpeed === 'quick' ? 'Quick' : 'Realistic'} — click to switch`"
          @click="store.setSpinSpeed(store.spinSpeed === 'quick' ? 'realistic' : 'quick')"
        >
          <UIcon
            name="i-lucide-timer"
            class="w-3.5 h-3.5"
          />
          {{ store.spinSpeed === 'quick' ? 'Quick' : 'Realistic' }}
        </button>
      </div>
    </header>
    <div
      class="flex-1 flex flex-col gap-4 p-4 overflow-auto"
      :style="{ background: 'var(--felt-dark)' }"
    >
      <!-- Top: the wheel and the betting layout, aligned to the top -->
      <div class="flex flex-col lg:flex-row items-center lg:items-start lg:justify-center gap-6">
        <!-- Left: the wheel + result -->
        <div class="flex flex-col items-center gap-3 shrink-0">
          <RouletteWheel
            ref="wheelRef"
            :variant="store.variant"
            :reduced-motion="reducedMotion"
            :size="380"
            :speed="store.spinSpeed"
          />
          <ResultBadge
            :latest="store.revealPocket"
            :history="historyPockets"
          />
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
            :max-cents="store.bankrollCents"
            @select="store.setSelectedChip"
            @dragstart="(p) => dragStart(p.cents, p.ev)"
          />
          <div class="flex items-center justify-center gap-5">
            <BetControls
              :spinning="store.phase === 'spinning'"
              :total-staked="store.totalStakedCents"
              :can-repeat="store.lastRoundBets.length > 0"
              @spin="spin"
              @clear="store.clearBets"
              @repeat="onRepeat"
            />
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] uppercase tracking-wide text-neutral-400">Your stack</span>
              <BankrollStack
                :bankroll-cents="store.bankrollCents"
                :starting-cents="startingCents"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom: session + expected-value dashboard, side by side -->
      <div class="flex flex-col sm:flex-row gap-3 w-full max-w-5xl mx-auto">
        <StatsPanel class="flex-1 min-w-0" />
        <EvAdvisor class="flex-1 min-w-0" />
        <ResultBreakdown class="flex-1 min-w-0" />
      </div>
    </div>
    <div
      v-if="dragActive"
      class="fixed z-50 pointer-events-none w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-white/70 flex items-center justify-center text-xs font-bold text-white shadow-lg"
      :style="{ left: dragX + 'px', top: dragY + 'px', background: 'var(--chip-red)' }"
    >
      {{ formatCents(dragChipCents) }}
    </div>

    <UModal
      v-model:open="showBroke"
      title="You're out of chips"
      :ui="{ footer: 'justify-end gap-2' }"
    >
      <template #body>
        <p class="text-sm text-neutral-300">
          Your bankroll is empty — down
          <span class="font-mono text-rose-400">{{ formatSignedCents(store.sessionStats.netCents) }}</span>
          over {{ store.sessionStats.spins }} spins. What would you like to do?
        </p>
      </template>
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="onSaveSession"
        >
          Save session
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          @click="onNewSession"
        >
          New session
        </UButton>
        <UButton
          color="primary"
          @click="onBuyMoreChips"
        >
          Buy more chips (+{{ formatCents(startingCents) }})
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouletteStore } from '~/stores/roulette'
import { formatCents, formatSignedCents } from '~/utils/format'
import { downloadText } from '~/utils/download'
import { sessionToCsv } from '~/utils/sessionCsv'
import type { Pocket } from '~/engine/wheel'
import type { BetType } from '~/engine/bets'
import RouletteWheel from '~/components/wheel/RouletteWheel.vue'
import ResultBadge from '~/components/wheel/ResultBadge.vue'
import RouletteMat from '~/components/wheel/RouletteMat.vue'
import ChipTray from '~/components/wheel/ChipTray.vue'
import BetControls from '~/components/wheel/BetControls.vue'
import StatsPanel from '~/components/wheel/StatsPanel.vue'
import ResultBreakdown from '~/components/wheel/ResultBreakdown.vue'
import BankrollStack from '~/components/wheel/BankrollStack.vue'
import EvAdvisor from '~/components/wheel/EvAdvisor.vue'

const store = useRouletteStore()
const { dragging: dragActive, chipCents: dragChipCents, x: dragX, y: dragY, start: dragStart } = useChipDrag((descriptor, cents) => {
  lastNet.value = null
  store.placeBet(descriptor, cents)
})
const wheelRef = ref<{ spinTo: (p: Pocket) => Promise<void> } | null>(null)
const reducedMotion = ref(false)
const historyPockets = computed(() => store.spinHistory.map(s => s.pocket))
const lastNet = ref<number | null>(null)
const startingCents = computed(() => store.bankrollHistory[0] ?? store.bankrollCents)

const resultTone = computed<'none' | 'win' | 'loss' | 'neutral'>(() => {
  if (lastNet.value === null || store.phase === 'spinning') return 'none'
  if (lastNet.value > 0) return 'win'
  if (lastNet.value < 0) return 'loss'
  return 'neutral'
})
const resultText = computed(() => {
  if (resultTone.value === 'none') return ''
  if (resultTone.value === 'win') return 'Won ' + formatCents(lastNet.value!)
  if (resultTone.value === 'loss') return 'Lost ' + formatCents(-lastNet.value!)
  return 'No win'
})

const showBroke = ref(false)

function onBuyMoreChips() {
  store.rebuy(startingCents.value)
  showBroke.value = false
}
function onNewSession() {
  store.clearSession()
  showBroke.value = false
  navigateTo('/')
}
function onSaveSession() {
  downloadText('roulette-session.csv', sessionToCsv(store.sessionLog))
  showBroke.value = false
  navigateTo('/history')
}

onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) {
    navigateTo('/')
    return
  }
  reducedMotion.value = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (store.bankrollCents === 0 && store.totalStakedCents === 0) showBroke.value = true
})

function onPlace(descriptor: { type: BetType, numbers: Pocket[] }) {
  if (store.selectedChipCents === 0) {
    store.showFlash('Out of chips for this round.')
    return
  }
  lastNet.value = null
  store.placeBet(descriptor, store.selectedChipCents)
}

function onRepeat() {
  if (store.repeatLastBet()) lastNet.value = null
  else store.showFlash('Not enough in your bankroll to repeat that bet.')
}

async function spin() {
  if (store.phase === 'spinning') return
  if (store.totalStakedCents === 0) {
    store.showFlash('Place a bet before spinning.')
    return
  }
  if (!wheelRef.value) return
  const result = store.computeSpin()
  await wheelRef.value.spinTo(result.pocket)
  store.commitSpin(result)
  lastNet.value = result.netCents
  store.readyForNextSpin()
  const net = result.netCents
  if (net > 0) {
    store.showFlash('Won ' + formatCents(net), 'win', 3500)
  } else if (net < 0) {
    store.showFlash('Lost ' + formatCents(-net), 'loss', 3500)
  } else {
    store.showFlash('No win this spin', 'neutral', 3500)
  }
  if (store.bankrollCents === 0) showBroke.value = true
}
</script>

<style scoped>
.result-pill {
  min-width: 104px;
  text-align: center;
  font-family: var(--font-mono, 'Fira Code', monospace);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.02em;
  padding: 3px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.result-pill.tone-none {
  background: transparent;
  color: transparent;
  border-color: transparent;
}

.result-pill.tone-win {
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.35);
}

.result-pill.tone-loss {
  background: rgba(244, 63, 94, 0.14);
  color: #fb7185;
  border-color: rgba(244, 63, 94, 0.35);
}

.result-pill.tone-neutral {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.25);
}

.speed-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--gold, #d4a847);
  border: 1px solid rgba(212, 168, 71, 0.4);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}

.speed-toggle:hover {
  background: rgba(212, 168, 71, 0.1);
}
</style>
