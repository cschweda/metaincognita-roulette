<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-auto">
    <header class="py-3 border-b border-neutral-800">
      <div class="max-w-3xl mx-auto w-full px-4">
        <h1 class="text-lg font-semibold text-neutral-100">
          Drills
        </h1>
        <p class="text-xs text-neutral-400 mt-1">
          Quick practice — learn what every bet pays and why the house always wins.
        </p>
      </div>
    </header>

    <div class="p-4 flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <!-- Scoreboard -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5 text-neutral-400">
          <UIcon
            name="i-lucide-flame"
            class="w-3.5 h-3.5"
            :class="streak > 0 ? 'text-amber-400' : 'text-neutral-400'"
          />
          <span>
            Streak
            <span
              class="font-semibold tabular-nums"
              :class="streak > 0 ? 'text-amber-400' : 'text-neutral-300'"
            >{{ streak }}</span>
          </span>
        </div>
        <div class="text-neutral-400">
          <span class="font-semibold text-neutral-200 tabular-nums">{{ correct }}</span>
          <span class="text-neutral-400"> / </span>
          <span class="tabular-nums">{{ total }}</span>
          <span class="text-neutral-400"> correct</span>
        </div>
      </div>

      <!-- Quiz card -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 flex flex-col gap-4">
        <p
          id="drill-prompt"
          class="text-base font-medium text-neutral-100"
        >
          {{ question.prompt }}
        </p>

        <!-- Plain buttons, not ARIA radios: role="radio" promises roving-tabindex
             arrow-key navigation, and a one-shot quiz answer doesn't need it. -->
        <div class="flex flex-col gap-2">
          <button
            v-for="(choice, i) in question.choices"
            :key="i"
            type="button"
            :disabled="answered"
            class="w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 disabled:cursor-default"
            :class="choiceClass(i)"
            @click="answer(i)"
          >
            <span>{{ choice }}</span>
            <UIcon
              v-if="answered && i === question.correctIndex"
              name="i-lucide-check"
              class="w-4 h-4 shrink-0 text-emerald-300"
            />
            <UIcon
              v-else-if="answered && i === chosenIndex"
              name="i-lucide-x"
              class="w-4 h-4 shrink-0 text-rose-300"
            />
          </button>
        </div>

        <!-- Explanation + verdict (revealed after answering) -->
        <div
          aria-live="polite"
          class="min-h-0"
        >
          <div
            v-if="answered"
            class="rounded-lg border px-4 py-3 flex flex-col gap-1.5"
            :class="isCorrect
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-rose-500/30 bg-rose-500/5'"
          >
            <p
              class="text-sm font-semibold"
              :class="isCorrect ? 'text-emerald-300' : 'text-rose-300'"
            >
              {{ isCorrect ? 'Correct' : 'Not quite' }}
            </p>
            <p class="text-sm text-neutral-300 leading-relaxed">
              {{ question.explanation }}
            </p>
          </div>
        </div>

        <!-- Next -->
        <div
          v-if="answered"
          class="flex justify-end"
        >
          <UButton
            color="primary"
            variant="soft"
            trailing-icon="i-lucide-arrow-right"
            @click="next"
          >
            Next question
          </UButton>
        </div>
      </div>

      <p class="text-xs text-neutral-400 text-center">
        Same payouts, same edge — only the variance changes. The goal isn't to win; it's to see the math.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { makeDrillQuestion } from '~/utils/drills'
import { rouletteConfig } from '~~/roulette.config'

// Seed from a crypto value so every session is different, then count up so each
// individual question stays reproducible (makeDrillQuestion is pure).
function randomSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0]!
  }
  return Math.floor(Math.random() * 0xffffffff)
}

const seed = ref(randomSeed())
const question = computed(() => makeDrillQuestion(seed.value))

// Per-question answer state.
const chosenIndex = ref<number | null>(null)
const answered = computed(() => chosenIndex.value !== null)
const isCorrect = computed(() => chosenIndex.value === question.value.correctIndex)

// Practice score — persisted under the shared training key so progress
// survives navigation and reloads.
const streak = ref(0)
const correct = ref(0)
const total = ref(0)

const SCORE_KEY = rouletteConfig.storage.statsKey

function loadScore(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(SCORE_KEY)
    if (!raw) return
    const d = JSON.parse(raw) as Record<string, unknown>
    if (typeof d.correct === 'number' && typeof d.total === 'number' && typeof d.streak === 'number') {
      correct.value = d.correct
      total.value = d.total
      streak.value = d.streak
    }
  } catch {
    // Corrupt blob — start a fresh score.
  }
}

function saveScore(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify({ correct: correct.value, total: total.value, streak: streak.value }))
  } catch {
    // Storage full — the score simply stays in memory for this visit.
  }
}

onMounted(loadScore)

function answer(i: number) {
  if (answered.value) return
  chosenIndex.value = i
  total.value += 1
  if (i === question.value.correctIndex) {
    correct.value += 1
    streak.value += 1
  } else {
    streak.value = 0
  }
  saveScore()
}

function next() {
  seed.value += 1
  chosenIndex.value = null
}

function choiceClass(i: number): string {
  if (!answered.value) {
    return 'border-neutral-700 bg-neutral-800/40 text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800'
  }
  if (i === question.value.correctIndex) {
    return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
  }
  if (i === chosenIndex.value) {
    return 'border-rose-500/60 bg-rose-500/10 text-rose-200'
  }
  return 'border-neutral-800 bg-neutral-900/40 text-neutral-400'
}
</script>
