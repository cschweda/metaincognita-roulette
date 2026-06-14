# The Lab & Bankroll Stack — Implementation Plan (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add (1) a **bankroll chip-stack** that visibly grows/dwindles with the bankroll, and (2) a **`/lab` page** — the spec's §8 Lab — with hardcore session stats and a **wheel-condition sandbox** where the player makes the wheel true-or-biased and watches a real ≥100k-spin simulation prove it (χ², distribution, measured edge). Linked in the bottom nav.

**Architecture:** The Lab drives the **real engine** — no new math. It reuses `app/engine/sim.ts` (`runFrequencies`, `chiSquare`, `measureEdge`) and `app/engine/physics.ts` (`WheelCondition` = `{ biasStrength, biasCenter, biasWidth }`, consumed by `simulateSpin`). This is the same machinery that proves fairness in CI, now pointed at the player (spec §2.5/§8). The optional "apply this wheel at the table" path stores a `WheelCondition` and recreates the game with it.

**Visual reference:** the **"② Is it fair?"** tab in `.superpowers/brainstorm/16915-1781372333/content/wheel-physics-v6.html` (bias slider → run N spins → histogram + χ² verdict + measured edge). Port that interaction; use the engine's `sim.ts` (not the prototype's inline copy).

**Spec:** `docs/superpowers/specs/2026-06-13-roulette-trainer-design.md` (§8 the Lab; §2.4 the proof; §9 UI).

**Engine/app context:** `sim.ts` (`runFrequencies(variant, spins, seed, cond?)` → `number[]`, `chiSquare(counts)` → number, `measureEdge(variant, makeBet, rules, spins, seed)` → fraction); `physics.ts` (`WheelCondition`); `wheel.ts` (`WHEEL_ORDER`, `colorOf`, `pocketCount`, `Pocket`, `Variant`); `bets.ts` (`Bet`, `Rules`, `BetType`); store `useRouletteStore` (`bankrollCents`, `sessionStats`, `spinHistory`, `variant`, `evenMoney`, `bets`); `prng.ts` (`mulberry32`); `~/utils/format` (`formatCents`, `formatSignedCents`, `formatPercent`). The chrome lives in `app/layouts/default.vue` (bottom nav already has History · Analysis · Learn).

**Conventions:** Conventional Commits, NO AI trailer. Integer cents. Engine never imports Vue. Use **explicit imports** for components in `app/components/wheel/` (Nuxt prefixes them, which silently broke rendering in 2b). `pnpm test` / `NODE_OPTIONS=--max-old-space-size=8192 pnpm typecheck` / `pnpm lint` green before each commit. Don't edit sibling repos under `/Volumes/satechi/webdev/`.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/components/wheel/BankrollStack.vue` (create) | A chip stack whose size scales with the bankroll |
| `app/pages/wheel.vue` (modify) | Show `BankrollStack` near the wheel |
| `app/layouts/default.vue` (modify) | Add a **Lab** bottom-nav link (`/lab`) |
| `app/pages/lab.vue` (create) | The Lab page: hardcore stats + the wheel-condition sandbox |
| `app/components/lab/HardcoreStats.vue` (create) | Exact session figures + theoretical references |
| `app/components/lab/WheelSandbox.vue` (create) | Bias controls → run sim → histogram + χ² verdict + edge |
| `app/stores/roulette.ts` (modify) | `wheelCondition` state + `setWheelCondition` (apply bias to the live game) |
| `test/unit/*.test.ts` | Cover the sandbox's pure helpers + the store condition |

---

## Task 1: Bankroll chip-stack

**Files:** Create `app/components/wheel/BankrollStack.vue`; Modify `app/pages/wheel.vue`. Test `test/nuxt/bankroll-stack.test.ts`.

- [ ] **Step 1: Failing component test `test/nuxt/bankroll-stack.test.ts`:**
```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BankrollStack from '../../app/components/wheel/BankrollStack.vue'

describe('BankrollStack', () => {
  it('renders more chips for a bigger bankroll', async () => {
    const small = await mountSuspended(BankrollStack, { props: { bankrollCents: 5_000, startingCents: 100_000 } })
    const big = await mountSuspended(BankrollStack, { props: { bankrollCents: 100_000, startingCents: 100_000 } })
    const count = (w: typeof small) => w.findAll('[data-chip]').length
    expect(count(big)).toBeGreaterThan(count(small))
  })
})
```

- [ ] **Step 2: Run `pnpm test:nuxt` — FAIL.**

- [ ] **Step 3: Create `app/components/wheel/BankrollStack.vue`.** Props `{ bankrollCents: number; startingCents: number }`. Render a side-view chip stack: the number of stacked chip discs scales with the bankroll relative to a unit, capped so it never overflows. Use a unit of `max(startingCents/20, 100)` so the stack is ~20 chips at the starting bankroll and visibly shrinks as the bankroll drops; cap at 24 discs and, if more, show a small `×N` multiplier. Each disc is a thin ellipse/rounded bar (`data-chip`), colored from the chip palette by tier, stacked vertically with a slight offset. Above/below the stack, show `formatCents(bankrollCents)` in mono. Make it compact (≈ 120px tall, 70px wide). Example structure:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { formatCents } from '~/utils/format'
const props = defineProps<{ bankrollCents: number; startingCents: number }>()
const unit = computed(() => Math.max(Math.round(props.startingCents / 20), 100))
const discs = computed(() => Math.max(0, Math.min(24, Math.round(props.bankrollCents / unit.value))))
const overflow = computed(() => Math.max(0, Math.round(props.bankrollCents / unit.value) - 24))
const tier = (i: number) => ['#c1272d', '#1b7a43', '#1a1a1a', '#6d28d9'][i % 4]
</script>
```
Render `discs` stacked discs (each a ~14px-wide, 6px-tall rounded element with `data-chip`), the `formatCents` label, and the `×{{ overflow }}` when overflow > 0. Add `role="img"` + `:aria-label="'Bankroll ' + formatCents(bankrollCents)"`.

- [ ] **Step 4: `pnpm test:nuxt` — PASS.**

- [ ] **Step 5: Add it to `app/pages/wheel.vue`** — explicit import `import BankrollStack from '~/components/wheel/BankrollStack.vue'`. Place it in the LEFT column, just below the wheel and above `ResultBadge` (or beside the `ResultBadge` in a small row), passing `:bankroll-cents="store.bankrollCents"` and a starting value. For `startingCents`, derive the session's starting bankroll as `store.bankrollCents - store.sessionStats.netCents + store.totalStakedCents` (current + net-back-out + on-table) OR, simpler, use the first entry of `store.bankrollHistory` if present, else `store.bankrollCents`. Keep the left column short enough to still fit (the wheel is already `:size="380"`); if needed, place `BankrollStack` and `ResultBadge` side-by-side in a `flex gap-4` row to save vertical space.

- [ ] **Step 6: Quality gates + commit:**
```bash
git add app/components/wheel/BankrollStack.vue app/pages/wheel.vue test/nuxt/bankroll-stack.test.ts
git commit -m "feat(ui): bankroll chip-stack that scales with the bankroll"
```

---

## Task 2: Lab nav link + page scaffold + store wheel-condition

**Files:** Modify `app/layouts/default.vue`, `app/stores/roulette.ts`; Create `app/pages/lab.vue`.

- [ ] **Step 1: Add a "Lab" bottom-nav link** in `app/layouts/default.vue` — alongside History/Analysis/Learn, add a button with `i-lucide-flask-conical` routing to `/lab`, matching the existing nav styling and the `isSubPage` active logic.

- [ ] **Step 2: Store wheel-condition (for the apply-to-game path).** In `app/stores/roulette.ts`:
  - Add `import type { WheelCondition } from '../engine/physics'`.
  - Add state `wheelCondition: {} as WheelCondition`.
  - In `initializeGame`, after creating the game, set `this.wheelCondition = {}`.
  - Add an action:
    ```ts
    setWheelCondition(cond: WheelCondition) {
      this.wheelCondition = cond
      if (this.game) {
        // recreate the game so future spins use the new condition; keep a fresh seed
        this.game = markRaw(new RouletteGame({ variant: this.variant, evenMoney: this.evenMoney }, cryptoSeed(), cond))
      }
      this.saveToLocalStorage()
    }
    ```
  - In `snapshot()` include `wheelCondition: this.wheelCondition`; in `loadFromLocalStorage`, restore it and create the game WITH it: `this.game = markRaw(new RouletteGame({ variant: this.variant, evenMoney: this.evenMoney }, cryptoSeed(), session.wheelCondition))`.
  - In `sessionState.ts`: add `wheelCondition: WheelCondition` to `RouletteSession` (import the type), and in `parseSession` default it tolerantly: `if (typeof session.wheelCondition !== 'object' || session.wheelCondition === null) session.wheelCondition = {}`.
  - Update `test/unit/store-persistence.test.ts` sample to include `wheelCondition: {}`.
  *(Note: `RouletteGame`'s constructor already accepts a 3rd `cond` arg; confirm in `app/engine/round.ts` and pass it through.)*

- [ ] **Step 3: Create `app/pages/lab.vue`** — `onMounted` load session or `navigateTo('/')`. A scrollable page (inside the chrome) with a title "The Lab", a short intro line ("Run the real engine at scale — prove the wheel, or break it."), then two sections: `<LabHardcoreStats />` and `<LabWheelSandbox />` (explicit imports). Use the casino tokens; keep it a11y-clean and mobile-friendly (stacked sections).

- [ ] **Step 4: Quality gates + commit:**
```bash
git add app/layouts/default.vue app/stores/roulette.ts app/stores/sessionState.ts test/unit/store-persistence.test.ts app/pages/lab.vue
git commit -m "feat(ui): Lab nav link + /lab scaffold + store wheel-condition"
```

---

## Task 3: Hardcore stats

**Files:** Create `app/components/lab/HardcoreStats.vue`; Test `test/unit/lab-stats.test.ts`.

- [ ] **Step 1:** Create a pure helper module `app/components/lab/labStats.ts` (or inline in the SFC + a tested helper) computing, from the store's data:
  - **Realized edge** = `sessionStats.wageredCents > 0 ? sessionStats.netCents / sessionStats.wageredCents * -1 : 0` (house edge = −net/wagered; show as %).
  - **Pocket frequency** over `spinHistory` (count per pocket; show the top few hot/cold).
  - **Biggest win / worst loss** = max/min of `spinHistory[].netCents`.
  - **Theoretical edge** for the active preset (from `rouletteConfig.presets` `edgePct`).
  Write a tested pure function `realizedEdge(netCents, wageredCents): number` with a unit test (e.g. wagered 1000, net −27 → 0.027).

- [ ] **Step 2:** `HardcoreStats.vue` reads `useRouletteStore()` and renders a tidy grid of exact figures (mono): spins, wagered, net (signed/colored), realized edge vs theoretical edge (side by side — "you're running at X% vs the theoretical Y%"), biggest win, worst loss, and a compact hot/cold pocket list. Label realized figures as *measurement* and theoretical as *model* (spec honesty rule).

- [ ] **Step 3:** Quality gates + commit:
```bash
git add app/components/lab/ test/unit/lab-stats.test.ts
git commit -m "feat(ui): Lab hardcore stats (realized vs theoretical edge, pocket freq)"
```

---

## Task 4: The wheel-condition sandbox

**Files:** Create `app/components/lab/WheelSandbox.vue`; Test `test/unit/lab-sandbox.test.ts`.

- [ ] **Step 1: Test the pure verdict helper `test/unit/lab-sandbox.test.ts`:** Add a helper (in a small `app/components/lab/sandbox.ts`) `chiCritical(df: number): number` returning the ~99.9% critical value (`df + 3.09 * Math.sqrt(2 * df)` is acceptable) and `isUniform(chi, df): boolean`. Test: for df=36, a χ² near 36 is uniform, a χ² of 200 is not.

- [ ] **Step 2: Create `app/components/lab/WheelSandbox.vue`** porting the prototype's "② Is it fair?" interaction, driven by `sim.ts`:
  - Controls: a **variant** toggle (single/double), a **spins** selector (10,000 / 100,000 / 1,000,000), and a **"Wheel condition"** slider 0–100 mapped to `biasStrength` 0–1 (label: 0 = "perfectly true" … 100 = "rigged"); use fixed `biasCenter`/`biasWidth` defaults (e.g. 7 / 5) under the hood.
  - A **Run** button: build `cond = biasStrength > 0 ? { biasStrength: slider/100, biasCenter: 7, biasWidth: 5 } : {}`, then `const counts = runFrequencies(variant, spins, seed, cond)`, `const chi = chiSquare(counts)`, and an empirical edge via `measureEdge(variant, () => redBet, rules, spins, seed)`. Seed with a fixed or `Date.now()`-derived value (Date.now is fine in the browser).
  - Results: draw the **histogram** (SVG bars per pocket, colored by `colorOf`, with an expected-frequency line), show **χ²** + a verdict via `isUniform(chi, df)` ("✓ within tolerance — statistically fair" / "✗ biased — fails the uniformity test"), and the **measured house edge** vs theory. Show a "running…" state during the (synchronous) run for large N (use `await nextTick()` before the heavy loop so the UI updates; note a web-worker as a future enhancement if 1M blocks too long).
  - An **"Apply this wheel at the table"** button → `store.setWheelCondition(cond)` with a clear warning chip ("the table wheel is now biased — see if you can tell") and a **"Restore a true wheel"** button → `store.setWheelCondition({})`. Show the current table condition state.

- [ ] **Step 3:** Quality gates + commit:
```bash
git add app/components/lab/WheelSandbox.vue app/components/lab/sandbox.ts test/unit/lab-sandbox.test.ts
git commit -m "feat(ui): Lab wheel-condition sandbox — sim, chi-square verdict, apply-to-game"
```

---

## Task 5: Browser smoke + a11y

- [ ] **Step 1:** Start the dev server (`PORT=<free> pnpm dev`). With a seeded session, open `/lab`.
- [ ] **Step 2: Drive it (chrome-devtools for interaction; viewcap for any screenshots of public pages):**
  - `/lab` renders both sections; the nav "Lab" link works and is active.
  - In the sandbox: leave the slider at 0, Run 100,000 → histogram is flat, **χ² passes** ("fair"). Drag the slider up, Run → a sector bulges, **χ² fails** ("biased"), measured edge shifts. No console errors. (Confirm the numbers via `evaluate_script`, not a screenshot.)
  - "Apply at the table" → go to `/wheel`, spin a few times, and confirm the engine now favors the biased arc; "Restore a true wheel" returns it. (Verify via the store/results through `evaluate_script`.)
  - HardcoreStats shows the realized vs theoretical edge correctly for the seeded session.
- [ ] **Step 3: a11y** — `lightcap run_a11y` on `/lab` (public — but it redirects without a session; audit it after confirming, or audit the chrome via `/`). Resolve AA issues. The sandbox controls must be real, labeled inputs/buttons.
- [ ] **Step 4:** `pnpm test` / typecheck / lint green. Commit any fixes.
```bash
git add -A
git commit -m "feat(ui): Lab browser-smoke + a11y fixes"
```

---

## Self-Review — spec coverage

| Requirement | Task |
|---|---|
| Bankroll visceral feedback (chip stack dwindles/grows) | 1 |
| The Lab as a page, linked in the chrome (§2.5/§8) | 2 |
| Hardcore stats: realized vs theoretical edge, pocket freq (§2.4 honesty) | 3 |
| Wheel-condition sandbox: bias → real sim → χ²/edge (§8 physics sandbox) | 4 |
| Apply bias to the live game (advantage-play lesson) | 2, 4 |
| Render-verification + a11y AA (§4, §9) | 5 |

**Deferred (a later plan — the rest of the "trainer"):** the EV advisor + per-decision feedback; the betting-system simulators (Martingale/D'Alembert) and bankroll fan / risk-of-ruin charts; drills; the Analysis & Learn pages; chip-on-line inside bets; realistic↔relaxed spin-speed setting.

## Execution Handoff

After the Lab, the remaining trainer surfaces (advisor, feedback, drills, the betting-system + risk-of-ruin simulators, Analysis/Learn pages) form the final plan(s).
