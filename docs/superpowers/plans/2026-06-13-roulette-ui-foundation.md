# Roulette UI — Foundation & Chrome Implementation Plan (Plan 2a of the UI phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Nuxt 4 app with the Metaincognita family chrome around our existing verified engine — the app boots, a setup screen starts a session, the `/wheel` page renders the shell, sessions persist (versioned), and the **29 engine tests keep passing** — without yet building the wheel animation or betting (those are Plans 2b/2c).

**Architecture:** Adapt the **craps skeleton** (`/Volumes/satechi/webdev/metaincognita-craps`) for the shared chrome (single-file `layouts/default.vue`, `app.vue`, configs) and the engine-bridge shape (Pinia store + composables + `setTimeout`-paced page animation). Keep the pure engine exactly where it is (`app/engine/`). The renderer for the wheel will be a hand-rolled canvas (Plan 2b); this plan only lays the foundation. Switch the repo from npm to **pnpm** to match the suite.

**Tech Stack:** Nuxt ^4.4 · Vue 3 · @nuxt/ui ^4.6 · Tailwind ^4.2 · Pinia · TypeScript ^6 · Vitest ^4 (unit + nuxt projects) · Playwright · pnpm. Engine stays framework-free under `app/engine/`.

**Reference repos (read locally, do not modify):**
- Chrome/scaffold/config: `/Volumes/satechi/webdev/metaincognita-craps`
- Design-system authority (tokens, OG): `/Volumes/satechi/webdev/metaincognita-video-poker/docs/design-system.md`

**Spec:** `docs/superpowers/specs/2026-06-13-roulette-trainer-design.md` (§5 bets/pay, §6 persistence, §9 UI standard).

**Engine exports available** (`app/engine/`): `wheel.ts` (`Variant`, `Pocket`, `WHEEL_ORDER`, `REDS`, `colorOf`, `pocketCount`), `bets.ts` (`BetType`, `PAYOUTS`, `COLUMNS`, `DOZENS`, `Bet`, `Rules`, `EvenMoneyRule`, `coverage`, `settleBet`), `physics.ts` (`simulateSpin`, `Spin`, `WheelCondition`), `round.ts` (`RouletteGame`, `RoundResult`), `prng.ts` (`mulberry32`, `Rng`), `money.ts` (`formatCents`, `winningsCents`), `sim.ts`.

**Convention reminders:** Conventional Commits, NO `Co-Authored-By`/AI trailer. Money is integer cents. The engine must never import Vue/Nuxt/Pinia.

---

## File Structure (created/modified in this plan)

| File | Responsibility |
|---|---|
| `package.json` | Rewritten to the Nuxt 4 stack (pnpm); preserves engine test scripts |
| `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`, `netlify.toml`, `.npmrc` | Copied/adapted from craps |
| `vitest.config.ts` | Two projects: `unit` (includes `app/engine/**` + `test/unit`), `nuxt` (happy-dom) |
| `nuxt.config.ts` | SPA, modules, css, dark colorMode, head + OG meta using our og-image |
| `app/app.vue` | Root: `UApp > NuxtLayout > NuxtPage` + `useSeoMeta` |
| `app/app.config.ts` | `ui.colors.primary: 'rose'` (roulette accent), `neutral: 'slate'` |
| `app/assets/css/main.css` | Tailwind + Nuxt UI import; casino-luxury tokens |
| `app/layouts/default.vue` | The chrome: top bar (back/leave + session dot), bottom nav (History · Analysis · Learn + version + GitHub), leave-confirm modal |
| `app/pages/index.vue` | Setup screen |
| `app/pages/wheel.vue` | Game page shell (placeholder felt; wheel/mat arrive in 2b/2c) |
| `app/pages/[...slug].vue` | 404 |
| `app/components/setup/*` | `HeroConfig.vue`, `VariantSelector.vue`, `StakeSelector.vue` |
| `roulette.config.ts` | Canonical game config: variants, rule presets, stakes, storage keys, timings |
| `app/stores/roulette.ts` | Pinia store: session state + versioned persistence |
| `app/utils/format.ts`, `app/utils/sanitize.ts` | Copied from craps |
| `start-dev-server.sh` | Updated to pnpm |

---

## Task 1: Switch toolchain to the Nuxt 4 stack (pnpm), preserve engine tests

**Files:** Modify `package.json`; Create `pnpm-workspace.yaml`, `.npmrc`, `vitest.config.ts` (replace), `eslint.config.mjs`, `tsconfig.json` (replace), `netlify.toml`; Delete `package-lock.json`.

- [ ] **Step 1: Replace `package.json`** with the Nuxt stack (versions matched to craps `/Volumes/satechi/webdev/metaincognita-craps/package.json`):

```json
{
  "name": "metaincognita-roulette",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "pnpm clean && nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "clean": "rm -rf node_modules/.vite .nuxt",
    "lint": "eslint .",
    "typecheck": "nuxt typecheck",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --project unit",
    "test:nuxt": "vitest run --project nuxt",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@iconify-json/lucide": "^1.2.100",
    "@iconify-json/simple-icons": "^1.2.75",
    "@nuxt/ui": "^4.6.0",
    "nuxt": "^4.4.2",
    "pinia": "^3.0.4",
    "@pinia/nuxt": "^0.11.3"
  },
  "devDependencies": {
    "@nuxt/eslint": "^1.15.2",
    "@nuxt/test-utils": "4.0.0",
    "@playwright/test": "^1.59.1",
    "@vue/test-utils": "^2.4.6",
    "eslint": "^9.0.0",
    "happy-dom": "^20.8.9",
    "tailwindcss": "^4.2.2",
    "typescript": "^6.0.2",
    "vitest": "^4.1.2",
    "vue-tsc": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `.npmrc`** (copy from craps if present; otherwise):

```
shamefully-hoist=true
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`** (copy verbatim from `/Volumes/satechi/webdev/metaincognita-craps/pnpm-workspace.yaml`; if it only declares an empty `packages:` list that is fine).

- [ ] **Step 4: Replace `tsconfig.json`** with the Nuxt-generated references form (copy from craps `/Volumes/satechi/webdev/metaincognita-craps/tsconfig.json`). It typically is:

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

- [ ] **Step 5: Copy `eslint.config.mjs` and `netlify.toml`** from craps, updating only repo-name strings:
  - In `netlify.toml`, ensure `command = "pnpm generate"` and `publish = "dist"`; keep the security headers/CSP block as-is.

- [ ] **Step 6: Replace `vitest.config.ts`** so the existing engine tests run in the `unit` project and component tests get a `nuxt` project:

```ts
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['app/engine/**/*.test.ts', 'test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
        },
      }),
    ],
  },
})
```

- [ ] **Step 7: Remove npm lockfile, install with pnpm.**

Run: `rm -f package-lock.json && pnpm install`
Expected: pnpm resolves and installs; `pnpm-lock.yaml` is created. (If `nuxt prepare` postinstall warns because no `nuxt.config.ts` exists yet, that is fine — it's added in Task 2; you may temporarily create an empty `nuxt.config.ts` with `export default defineNuxtConfig({})` to satisfy prepare, which Task 2 then overwrites.)

- [ ] **Step 8: Verify the engine tests still pass under Vitest 4.**

Run: `pnpm test:unit`
Expected: **29 passed** (the engine suite is unchanged; Vitest 4 runs it in the `node` project).

- [ ] **Step 9: Update `start-dev-server.sh`** — change the final line `exec npm run dev -- --port "$PORT"` to `exec pnpm dev -- --port "$PORT"`, and the no-dev-script note's `npm run dev` reference to `pnpm dev`.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json eslint.config.mjs netlify.toml vitest.config.ts start-dev-server.sh
git rm --cached package-lock.json 2>/dev/null || true
git add -A
git commit -m "chore(ui): adopt the Nuxt 4 + pnpm family toolchain; preserve engine tests"
```

---

## Task 2: Nuxt core scaffold (boots to a blank app)

**Files:** Create `nuxt.config.ts`, `app/app.vue`, `app/app.config.ts`, `app/assets/css/main.css`.

- [ ] **Step 1: Create `nuxt.config.ts`** (adapt craps; add full OG meta pointing at our committed `public/og-image.png`):

```ts
export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxt/ui', '@nuxt/test-utils'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  colorMode: { preference: 'dark', fallback: 'dark' },
  app: {
    head: {
      title: 'Roulette Trainer',
      meta: [
        { name: 'description', content: 'A visual, accurate roulette trainer with a real forward-physics wheel — proven fair by simulation.' },
        { property: 'og:title', content: 'Roulette Trainer' },
        { property: 'og:description', content: 'A real forward-physics wheel, proven fair. Learn why you can’t beat the wheel.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/og-image.svg' }],
    },
  },
  compatibilityDate: '2025-01-15',
  eslint: { config: { stylistic: { commaDangle: 'never', braceStyle: '1tbs' } } },
})
```

- [ ] **Step 2: Create `app/app.vue`** (copy craps shape; roulette title/desc):

```vue
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Roulette Trainer',
  description: 'A visual, accurate roulette trainer with a real forward-physics wheel — proven fair by simulation.',
})
</script>
```

- [ ] **Step 3: Create `app/app.config.ts`** (roulette accent = rose, matching the og-image red):

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'rose',
      neutral: 'slate',
    },
  },
})
```

- [ ] **Step 4: Create `app/assets/css/main.css`** — Tailwind + Nuxt UI plus the shared casino-luxury tokens (the design-system felt/walnut/gold/cream/chip palette, made available as CSS variables so both the chrome and the felt can use them):

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  --font-sans: 'Public Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, monospace;
}

/* Shared Metaincognita casino-luxury tokens (design-system.md). */
:root {
  --felt: #0a5c36;
  --felt-dark: #073d24;
  --walnut: #3a2417;
  --gold: #d4a847;
  --cream: #f5f0e1;
  --chip-white: #f5f0e1;
  --chip-red: #c1272d;
  --chip-green: #1b7a43;
  --chip-black: #1a1a1a;
  --chip-purple: #6d28d9;
}
```

- [ ] **Step 5: Boot check.**

Run: `pnpm dev` (let it compile, then stop it with Ctrl-C once it prints the local URL without errors).
Expected: Nuxt starts, compiles with no errors, serves at `http://localhost:3000`. (A blank page is fine — no pages exist yet beyond Nuxt's default.)

- [ ] **Step 6: Commit**

```bash
git add nuxt.config.ts app/app.vue app/app.config.ts app/assets/css/main.css
git commit -m "feat(ui): nuxt core scaffold with dark mode, OG meta, and casino tokens"
```

---

## Task 3: `roulette.config.ts` — the canonical game config

**Files:** Create `roulette.config.ts`; Test `test/unit/config.test.ts`.

- [ ] **Step 1: Write the failing test `test/unit/config.test.ts`** (pins the config to the engine so they can't drift):

```ts
import { describe, it, expect } from 'vitest'
import { rouletteConfig } from '../../roulette.config'
import { PAYOUTS } from '../../app/engine/bets'

describe('roulette.config', () => {
  it('exposes the storage keys (versioned)', () => {
    expect(rouletteConfig.storage.sessionKey).toBe('roulette-session-v1')
    expect(rouletteConfig.storage.statsKey).toBe('roulette-training-v1')
  })
  it('exposes rule presets with their house edges', () => {
    const eu = rouletteConfig.presets.find((p) => p.id === 'european')
    expect(eu).toBeTruthy()
    expect(eu!.variant).toBe('single')
    expect(eu!.evenMoney).toBe('none')
  })
  it('payout ratios match the engine pay table exactly', () => {
    for (const [type, x] of Object.entries(rouletteConfig.payouts)) {
      expect(x).toBe(PAYOUTS[type as keyof typeof PAYOUTS])
    }
  })
  it('stake tiers are ordered and in integer cents', () => {
    expect(rouletteConfig.stakes.length).toBeGreaterThanOrEqual(3)
    for (const s of rouletteConfig.stakes) {
      expect(Number.isInteger(s.minBetCents)).toBe(true)
      expect(s.maxBetCents).toBeGreaterThan(s.minBetCents)
    }
  })
})
```

- [ ] **Step 2: Run it — expect FAIL** (`Cannot find module '../../roulette.config'`).

Run: `pnpm test:unit`

- [ ] **Step 3: Implement `roulette.config.ts`** (imports the engine's pay table so it cannot drift):

```ts
import type { Variant } from './app/engine/wheel'
import type { EvenMoneyRule } from './app/engine/bets'
import { PAYOUTS } from './app/engine/bets'

export interface RulePreset {
  id: string
  label: string
  variant: Variant
  evenMoney: EvenMoneyRule
  /** Theoretical house edge on most bets, for display (model figure). */
  edgePct: number
  blurb: string
}

export interface StakeTier {
  id: string
  label: string
  minBetCents: number
  maxBetCents: number
  defaultBankrollCents: number
}

export const rouletteConfig = {
  storage: {
    sessionKey: 'roulette-session-v1',
    statsKey: 'roulette-training-v1',
  },
  /** Pay table mirrors app/engine/bets.ts (single source of truth). */
  payouts: { ...PAYOUTS },
  presets: [
    { id: 'european', label: 'European (single zero)', variant: 'single', evenMoney: 'none', edgePct: 2.7, blurb: '37 pockets. 2.70% edge on every bet.' },
    { id: 'european-partage', label: 'European + La Partage', variant: 'single', evenMoney: 'la_partage', edgePct: 1.35, blurb: 'Recover half an even-money bet when zero hits — 1.35% edge.' },
    { id: 'american', label: 'American (double zero)', variant: 'double', evenMoney: 'none', edgePct: 5.26, blurb: '38 pockets. 5.26% edge; the First Five is worse (7.89%).' },
    { id: 'american-surrender', label: 'American + Surrender', variant: 'double', evenMoney: 'surrender', edgePct: 2.63, blurb: 'Half an even-money bet back on 0/00 — 2.63% edge.' },
  ] satisfies RulePreset[],
  stakes: [
    { id: 'low', label: 'Low', minBetCents: 100, maxBetCents: 50_000, defaultBankrollCents: 20_000 },
    { id: 'mid', label: 'Mid', minBetCents: 500, maxBetCents: 500_000, defaultBankrollCents: 100_000 },
    { id: 'high', label: 'High', minBetCents: 2_500, maxBetCents: 5_000_000, defaultBankrollCents: 1_000_000 },
  ] satisfies StakeTier[],
  /** Chip denominations offered in the tray (cents). */
  chips: [100, 500, 2_500, 10_000, 50_000],
  timings: { spinMs: 8800, settleRevealMs: 600 },
  defaultPresetId: 'european',
} as const
```

- [ ] **Step 4: Run the test — expect PASS** (`pnpm test:unit`, the new file passes and the 29 engine tests still pass).

- [ ] **Step 5: Commit**

```bash
git add roulette.config.ts test/unit/config.test.ts
git commit -m "feat(ui): canonical roulette.config pinned to the engine pay table"
```

---

## Task 4: Utilities + the chrome (layout)

**Files:** Create `app/utils/format.ts`, `app/utils/sanitize.ts`, `app/layouts/default.vue`, `app/pages/[...slug].vue`.

- [ ] **Step 1: Copy `app/utils/format.ts` and `app/utils/sanitize.ts`** from craps (`/Volumes/satechi/webdev/metaincognita-craps/app/utils/`) verbatim. (They provide `formatCents`, `formatSignedCents`, `formatPercent`, `sanitizeName`.) Confirm `formatCents` exists; if its behavior differs from the engine's `money.ts formatCents`, prefer the craps util for UI display (the engine one stays for engine use).

- [ ] **Step 2: Create `app/pages/[...slug].vue`** (copy craps's 404 page verbatim).

- [ ] **Step 3: Create `app/layouts/default.vue`** by adapting craps's `default.vue`. Read `/Volumes/satechi/webdev/metaincognita-craps/app/layouts/default.vue` and reproduce it with these exact changes:
  - Import/use `useRouletteStore` (Task 5) instead of `useCrapsStore`.
  - Top-bar wordmark text → `Roulette Trainer`; the Back button shows on the `/wheel` route (treat `route.path === '/wheel'` as the table page).
  - The "session active" indicator shows when `store.phase !== 'setup'`.
  - Bottom nav: keep **History** and **Analysis**, and add a **Learn** button (`i-lucide-graduation-cap`, routes to `/learn`) — the page is a later plan, so the button may route to a not-yet-built page; guard it the same way craps guards nav.
  - Version string: read from `package.json` is not available client-side; hardcode `v0.1.0` next to the GitHub link (a later release task wires it to the badge).
  - GitHub link href → `https://github.com/cschweda/metaincognita-roulette`.
  - Leave-confirm modal: on confirm call `store.clearSession()` then `router.push('/')`.
  - The navigation guard saves the session before routing away when `store.phase !== 'setup'`.

  Keep the exact Tailwind classes, heights (`h-9` bars), and structure from craps so the chrome is visually identical.

- [ ] **Step 4: Commit**

```bash
git add app/utils/format.ts app/utils/sanitize.ts app/layouts/default.vue app/pages/[...slug].vue
git commit -m "feat(ui): family chrome (top bar, bottom nav, leave-confirm) + utils"
```

---

## Task 5: The Pinia store with versioned persistence

**Files:** Create `app/stores/roulette.ts`; Test `test/unit/store-persistence.test.ts`.

- [ ] **Step 1: Write the failing test `test/unit/store-persistence.test.ts`** (pure functions for persistence so they're testable without a DOM):

```ts
import { describe, it, expect } from 'vitest'
import { serializeSession, parseSession, type RouletteSession } from '../../app/stores/sessionState'

const sample: RouletteSession = {
  version: 1,
  presetId: 'european',
  variant: 'single',
  evenMoney: 'none',
  playerName: 'Ada',
  bankrollCents: 100_000,
  selectedChipCents: 500,
  bets: [],
  spinHistory: [],
  sessionStats: { spins: 0, wageredCents: 0, netCents: 0 },
}

describe('session persistence (versioned)', () => {
  it('round-trips a valid session', () => {
    const restored = parseSession(serializeSession(sample))
    expect(restored).toEqual(sample)
  })
  it('rejects a wrong-version blob', () => {
    expect(parseSession(JSON.stringify({ ...sample, version: 99 }))).toBeNull()
  })
  it('rejects corrupt JSON', () => {
    expect(parseSession('{not json')).toBeNull()
  })
  it('rejects a structurally-invalid blob', () => {
    expect(parseSession(JSON.stringify({ version: 1 }))).toBeNull()
  })
})
```

- [ ] **Step 2: Run it — expect FAIL** (`Cannot find module '.../sessionState'`).

- [ ] **Step 3: Create `app/stores/sessionState.ts`** (the pure, testable persistence core — no Pinia, no DOM):

```ts
import type { Variant } from '../engine/wheel'
import type { EvenMoneyRule, Bet } from '../engine/bets'
import type { Pocket } from '../engine/wheel'

export const SESSION_VERSION = 1 as const

export interface SpinRecord { pocket: Pocket; netCents: number }
export interface SessionStats { spins: number; wageredCents: number; netCents: number }

export interface RouletteSession {
  version: typeof SESSION_VERSION
  presetId: string
  variant: Variant
  evenMoney: EvenMoneyRule
  playerName: string
  bankrollCents: number
  selectedChipCents: number
  bets: Bet[]
  spinHistory: SpinRecord[]
  sessionStats: SessionStats
}

export function serializeSession(s: RouletteSession): string {
  return JSON.stringify(s)
}

/** Parse + validate + sanitize. Returns null on corrupt/foreign/wrong-version data. */
export function parseSession(raw: string): RouletteSession | null {
  let data: unknown
  try { data = JSON.parse(raw) } catch { return null }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.version !== SESSION_VERSION) return null
  if (typeof d.presetId !== 'string' || typeof d.playerName !== 'string') return null
  if (typeof d.bankrollCents !== 'number' || !Number.isFinite(d.bankrollCents)) return null
  if (!Array.isArray(d.bets) || !Array.isArray(d.spinHistory)) return null
  if (typeof d.variant !== 'string' || typeof d.evenMoney !== 'string') return null
  if (typeof d.selectedChipCents !== 'number') return null
  if (typeof d.sessionStats !== 'object' || d.sessionStats === null) return null
  return data as RouletteSession
}
```

- [ ] **Step 4: Run the test — expect PASS** (`pnpm test:unit`).

- [ ] **Step 5: Create `app/stores/roulette.ts`** — the Pinia store that uses `sessionState` for persistence:

```ts
import { defineStore } from 'pinia'
import { rouletteConfig } from '../../roulette.config'
import type { Variant } from '../engine/wheel'
import type { EvenMoneyRule, Bet } from '../engine/bets'
import {
  SESSION_VERSION, serializeSession, parseSession,
  type RouletteSession, type SpinRecord, type SessionStats,
} from './sessionState'

export type Phase = 'setup' | 'betting' | 'spinning' | 'resolved'

interface InitArgs {
  presetId: string
  playerName: string
  bankrollCents: number
  selectedChipCents: number
}

export const useRouletteStore = defineStore('roulette', {
  state: () => ({
    phase: 'setup' as Phase,
    presetId: rouletteConfig.defaultPresetId as string,
    variant: 'single' as Variant,
    evenMoney: 'none' as EvenMoneyRule,
    playerName: '',
    bankrollCents: 0,
    selectedChipCents: rouletteConfig.chips[0]!,
    bets: [] as Bet[],
    spinHistory: [] as SpinRecord[],
    sessionStats: { spins: 0, wageredCents: 0, netCents: 0 } as SessionStats,
    storageWarning: false,
  }),
  getters: {
    preset: (s) => rouletteConfig.presets.find((p) => p.id === s.presetId) ?? rouletteConfig.presets[0]!,
  },
  actions: {
    initializeGame(args: InitArgs) {
      const preset = rouletteConfig.presets.find((p) => p.id === args.presetId) ?? rouletteConfig.presets[0]!
      this.presetId = preset.id
      this.variant = preset.variant
      this.evenMoney = preset.evenMoney
      this.playerName = args.playerName
      this.bankrollCents = args.bankrollCents
      this.selectedChipCents = args.selectedChipCents
      this.bets = []
      this.spinHistory = []
      this.sessionStats = { spins: 0, wageredCents: 0, netCents: 0 }
      this.phase = 'betting'
      this.saveToLocalStorage()
    },
    snapshot(): RouletteSession {
      return {
        version: SESSION_VERSION,
        presetId: this.presetId,
        variant: this.variant,
        evenMoney: this.evenMoney,
        playerName: this.playerName,
        bankrollCents: this.bankrollCents,
        selectedChipCents: this.selectedChipCents,
        bets: this.bets,
        spinHistory: this.spinHistory,
        sessionStats: this.sessionStats,
      }
    },
    saveToLocalStorage() {
      if (typeof localStorage === 'undefined') return
      try {
        localStorage.setItem(rouletteConfig.storage.sessionKey, serializeSession(this.snapshot()))
        this.storageWarning = false
      } catch {
        this.storageWarning = true // quota failure → in-memory session with a visible warning
      }
    },
    loadFromLocalStorage(): boolean {
      if (typeof localStorage === 'undefined') return false
      const raw = localStorage.getItem(rouletteConfig.storage.sessionKey)
      if (!raw) return false
      const session = parseSession(raw)
      if (!session) { localStorage.removeItem(rouletteConfig.storage.sessionKey); return false }
      this.presetId = session.presetId
      this.variant = session.variant
      this.evenMoney = session.evenMoney
      this.playerName = session.playerName
      this.bankrollCents = session.bankrollCents
      this.selectedChipCents = session.selectedChipCents
      this.bets = session.bets
      this.spinHistory = session.spinHistory
      this.sessionStats = session.sessionStats
      this.phase = 'betting'
      return true
    },
    clearSession() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(rouletteConfig.storage.sessionKey)
      this.$reset()
    },
  },
})
```

- [ ] **Step 6: Commit**

```bash
git add app/stores/sessionState.ts app/stores/roulette.ts test/unit/store-persistence.test.ts
git commit -m "feat(ui): roulette store with versioned, validated persistence"
```

---

## Task 6: The setup screen

**Files:** Create `app/pages/index.vue`, `app/components/setup/HeroConfig.vue`, `app/components/setup/VariantSelector.vue`, `app/components/setup/StakeSelector.vue`.

- [ ] **Step 1: Create `app/components/setup/HeroConfig.vue`** — adapt craps's `setup/HeroConfig.vue` (name + bankroll inputs, `v-model`), using `sanitizeName` on the name. Two props/emits: `name` and `bankrollCents` (bankroll entered in dollars, stored as cents).

- [ ] **Step 2: Create `app/components/setup/VariantSelector.vue`** — a grid of the four `rouletteConfig.presets` as clickable cards (label + blurb + `edgePct` shown in mono). Selected card highlighted with `border-primary-500 bg-primary-500/10`. Emits the chosen `presetId`. (This is the roulette analogue of craps's `TableRules`, but presented as preset cards because the variant *is* the headline choice — the edge is shown so the player sees the cost of the table.)

```vue
<template>
  <div>
    <h3 class="text-sm font-semibold text-neutral-300 mb-3">Choose your table</h3>
    <div class="grid sm:grid-cols-2 gap-3">
      <button
        v-for="p in presets" :key="p.id" type="button"
        class="text-left rounded-xl border p-4 transition"
        :class="modelValue === p.id ? 'border-primary-500 bg-primary-500/10' : 'border-neutral-800 hover:border-neutral-700'"
        @click="$emit('update:modelValue', p.id)"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-neutral-100">{{ p.label }}</span>
          <span class="font-mono text-sm text-primary-400">{{ p.edgePct.toFixed(2) }}%</span>
        </div>
        <p class="text-xs text-neutral-400 mt-1">{{ p.blurb }}</p>
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
```

- [ ] **Step 3: Create `app/components/setup/StakeSelector.vue`** — adapt craps's `StakeSelector.vue`; show `rouletteConfig.stakes` tiers (min/max bet + default bankroll, formatted with `formatCents`). Emits chosen `stakeId` and exposes its `defaultBankrollCents` so the parent can prefill bankroll.

- [ ] **Step 4: Create `app/pages/index.vue`** — adapt craps's `index.vue` setup card: title, the three setup components in a `rounded-2xl bg-neutral-900/80 border border-neutral-800 p-6 space-y-8` card divided by `border-t`, and a primary "Take a seat" button. `canStart = name.trim().length > 0 && bankrollCents > 0`. On submit:

```ts
store.initializeGame({ presetId, playerName: name, bankrollCents, selectedChipCents: rouletteConfig.chips[0]! })
await navigateTo('/wheel')
```

  Also: `onMounted`, if `store.loadFromLocalStorage()` returns true, offer a "Resume session" affordance that routes to `/wheel` (match the craps resume behavior if present; otherwise a simple banner with a Resume button).

- [ ] **Step 5: Commit**

```bash
git add app/pages/index.vue app/components/setup/
git commit -m "feat(ui): setup screen — variant/edge picker, stake tiers, buy-in"
```

---

## Task 7: The `/wheel` page shell

**Files:** Create `app/pages/wheel.vue`.

- [ ] **Step 1: Create `app/pages/wheel.vue`** — the game page shell. It must:
  - `onMounted`: if `store.phase === 'setup'`, attempt `store.loadFromLocalStorage()`; if that returns false, `navigateTo('/')` (no session → back to setup).
  - Render a full-height flex column inside the chrome: a header strip showing `store.playerName`, `formatCents(store.bankrollCents)` (mono), the preset label + `edgePct`, and a placeholder felt area (`flex-1` centered) with the text "Wheel & betting mat arrive in Plans 2b–2c" plus a disabled "Spin" button. Use the casino tokens (`background: var(--felt-dark)` for the felt area).
  - Show the `store.storageWarning` as a small amber banner if true.

```vue
<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div v-if="store.storageWarning" class="bg-amber-500/15 text-amber-300 text-xs px-3 py-1 text-center">
      Storage is full — playing in memory only; this session won’t be saved.
    </div>
    <header class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
      <div class="text-sm text-neutral-300">{{ store.playerName }}</div>
      <div class="font-mono text-lg text-cream">{{ formatCents(store.bankrollCents) }}</div>
      <div class="text-xs text-neutral-400">
        {{ store.preset.label }} · <span class="font-mono text-primary-400">{{ store.preset.edgePct.toFixed(2) }}%</span>
      </div>
    </header>
    <div class="flex-1 flex flex-col items-center justify-center gap-4" :style="{ background: 'var(--felt-dark)' }">
      <p class="text-neutral-300/80 text-sm">Wheel &amp; betting mat arrive in Plans 2b–2c.</p>
      <UButton color="primary" disabled>Spin</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouletteStore } from '../stores/roulette'
import { formatCents } from '../utils/format'

const store = useRouletteStore()
onMounted(() => {
  if (store.phase === 'setup' && !store.loadFromLocalStorage()) navigateTo('/')
})
</script>
```
  (If the craps `formatCents` import path/signature differs, match it. `text-cream` may need to be an inline style `color: var(--cream)` if no Tailwind utility exists — prefer the inline style to avoid inventing utilities.)

- [ ] **Step 2: Commit**

```bash
git add app/pages/wheel.vue
git commit -m "feat(ui): /wheel page shell wired to the session store"
```

---

## Task 8: Browser smoke + accessibility pass

**Files:** none (verification); fix-forward commits only if issues surface.

- [ ] **Step 1: Start the app.** Run `pnpm dev` (or `./start-dev-server.sh`).

- [ ] **Step 2: Drive the real app and watch the console** (this is the required render-verification — green unit tests do not prove the app renders). Verify, with the browser + console open:
  - `/` renders the setup screen with the four preset cards (edges shown), stake tiers, name/bankroll, and the chrome (top bar + bottom nav with History · Analysis · Learn + GitHub + v0.1.0). No console errors.
  - Selecting a preset highlights it; "Take a seat" is disabled until name + bankroll are valid.
  - Submitting routes to `/wheel`, which shows the header (name, bankroll mono, preset + edge) and the placeholder felt.
  - **Refresh `/wheel`** → the session restores (bankroll/preset intact), proving versioned mid-session persistence.
  - Tapping **Back** from `/wheel` opens the leave-confirm; confirming returns to `/` and clears the session (refresh `/wheel` now redirects to `/`).
  - Corrupt the stored session in DevTools (`localStorage['roulette-session-v1'] = '{bad'`) and refresh `/wheel` → it cleanly redirects to setup (no crash).

- [ ] **Step 3: Accessibility check.** Run the project's a11y tooling against `/` and `/wheel` (axe). Resolve any AA contrast or semantics violations. Muted text floor is `neutral-400` on dark surfaces.

- [ ] **Step 4: Quality gates.** Run `pnpm test` (all projects — engine 29 + new unit tests green), `pnpm typecheck`, `pnpm lint`. Fix anything red.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(ui): foundation browser-smoke + a11y fixes"
```

---

## Self-Review — spec coverage

| Requirement | Task |
|---|---|
| Nuxt 4 family stack, pnpm (§9, §10) | 1, 2 |
| Identical chrome: status bar, bottom nav, leave-confirm (§9) | 4 |
| Per-game accent via app.config (§9) | 2 |
| Casino-luxury tokens (§9) | 2 |
| Canonical config pinned to engine pay table (§5, "computed not transcribed") | 3 |
| Variant/preset picker showing the edge (the headline choice) (§3, §7) | 6 |
| Versioned persistence + validate/sanitize + corrupt→reset + quota→in-memory warning (§6) | 5 |
| Mid-session refresh restores state (§6) | 7, 8 |
| Engine purity preserved (engine untouched, tests green) (§6) | 1 |
| Render-verification browser smoke + a11y AA (§4, §9) | 8 |

**Deferred to 2b/2c (not gaps):** the canvas wheel + spin animation (2b); the betting mat, chip placement, bets→spin→settle→bankroll, history/analysis pages (2c).

---

## Execution Handoff

After the foundation is green, **Plan 2b (the wheel)** productionizes the prototype's canvas wheel and wires the engine bridge (`useGameLoop().executeSpin()` driving an ~8.8s spin that reveals the engine's result), followed by **Plan 2c (the mat + play loop)**.
