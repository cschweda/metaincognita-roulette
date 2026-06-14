<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const store = useRouletteStore()

const isSetup = computed(() => route.path === '/')
const isWheel = computed(() => route.path === '/wheel')
const isSubPage = computed(() => route.path === '/history' || route.path === '/analysis' || route.path === '/learn' || route.path === '/lab')

// Back button logic
const showLeaveConfirm = ref(false)

function handleBack() {
  if (isWheel.value) {
    // On wheel: warn about losing session
    showLeaveConfirm.value = true
  } else if (isSubPage.value) {
    // On sub-pages: go back (game state already saved)
    router.back()
  }
}

function confirmLeave() {
  store.clearSession()
  showLeaveConfirm.value = false
  router.push('/')
}

// Save game state before navigating to sub-pages
function navigateTo(path: string) {
  if (store.phase !== 'setup') {
    store.saveToLocalStorage()
  }
  router.push(path)
}

const hasActiveSession = computed(() => store.phase !== 'setup')
</script>

<template>
  <div class="h-screen bg-neutral-950 flex flex-col overflow-hidden">
    <!-- Top status bar -->
    <nav class="h-9 flex items-center justify-between px-3 bg-neutral-900 border-b border-neutral-800 shrink-0 z-50">
      <div class="flex items-center gap-2">
        <button
          v-if="!isSetup"
          class="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          @click="handleBack"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="w-3.5 h-3.5"
          />
          <span>Back</span>
        </button>
        <span
          v-else
          class="text-xs text-neutral-400 select-none"
        >
          <span class="text-amber-400">Roulette</span> Trainer
        </span>
      </div>
      <div
        v-if="hasActiveSession && !isWheel"
        class="flex items-center gap-1"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span class="text-[10px] text-neutral-400">Session active</span>
      </div>
    </nav>

    <!-- Page content -->
    <main class="flex-1 flex flex-col min-h-0">
      <slot />
    </main>

    <!-- Bottom status bar -->
    <nav class="h-9 flex items-center justify-between px-3 bg-neutral-900 border-t border-neutral-800 shrink-0 z-50">
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="route.path === '/history'
            ? 'text-amber-400'
            : 'text-neutral-400 hover:text-neutral-200'"
          @click="navigateTo('/history')"
        >
          <UIcon
            name="i-lucide-scroll-text"
            class="w-3.5 h-3.5"
          />
          <span>History</span>
        </button>
        <button
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="route.path === '/analysis'
            ? 'text-amber-400'
            : 'text-neutral-400 hover:text-neutral-200'"
          @click="navigateTo('/analysis')"
        >
          <UIcon
            name="i-lucide-chart-no-axes-combined"
            class="w-3.5 h-3.5"
          />
          <span>Analysis</span>
        </button>
        <button
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="route.path === '/learn'
            ? 'text-amber-400'
            : 'text-neutral-400 hover:text-neutral-200'"
          @click="navigateTo('/learn')"
        >
          <UIcon
            name="i-lucide-graduation-cap"
            class="w-3.5 h-3.5"
          />
          <span>Learn</span>
        </button>
        <button
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="route.path === '/lab'
            ? 'text-amber-400'
            : 'text-neutral-400 hover:text-neutral-200'"
          @click="navigateTo('/lab')"
        >
          <UIcon
            name="i-lucide-flask-conical"
            class="w-3.5 h-3.5"
          />
          <span>Lab</span>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-neutral-400">v0.1.0</span>
        <a
          href="https://github.com/cschweda/metaincognita-roulette"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <UIcon
            name="i-simple-icons-github"
            class="w-3.5 h-3.5"
          />
          <span>GitHub</span>
        </a>
      </div>
    </nav>

    <!-- Leave wheel confirmation modal -->
    <UModal
      v-model:open="showLeaveConfirm"
      title="Reset Session?"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <p class="text-neutral-400 text-sm">
          Your current session will be lost if you reset. Are you sure you want to return to setup?
        </p>
      </template>
      <template #footer>
        <UButton
          variant="outline"
          color="neutral"
          label="Cancel"
          @click="showLeaveConfirm = false"
        />
        <UButton
          color="error"
          label="Reset Session"
          @click="confirmLeave"
        />
      </template>
    </UModal>

    <FlashToast />
  </div>
</template>
