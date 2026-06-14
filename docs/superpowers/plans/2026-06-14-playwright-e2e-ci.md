# Playwright E2E + GitHub Actions CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Playwright E2E covering the money path (place → spin → settle → persist) and a GitHub Actions CI workflow that runs lint, typecheck, unit tests, and the E2E suite on push to `main` and on PRs.

**Architecture:** A `playwright.config.ts` at the project root configures a single Chromium project with `reducedMotion: 'reduce'` (so spins settle instantly), `baseURL` pointing at `PORT=3100`, and a `webServer` block that boots `pnpm dev`. A single spec file `e2e/money-path.spec.ts` covers the two required test cases. The Vitest config already restricts itself to `app/engine/**/*.test.ts` and `test/**/*.test.ts` patterns — `.spec.ts` files in `e2e/` are never picked up by Vitest. The GitHub Actions workflow installs Chromium via `playwright install --with-deps`, then runs all four gates sequentially.

**Tech Stack:** `@playwright/test ^1.59.1` (already installed), Nuxt 4 SPA (`ssr: false`), pnpm 10, Node 22, GitHub Actions.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `playwright.config.ts` | **Create** | Playwright configuration: baseURL, reducedMotion, webServer, Chromium project |
| `e2e/money-path.spec.ts` | **Create** | Two E2E tests: money-path + standalone pages smoke |
| `.github/workflows/ci.yml` | **Create** | CI: lint → typecheck → unit tests → E2E |
| `.gitignore` | **Modify** | Add Playwright artifact dirs |
| `README.md` | **Modify** | Add CI badge near existing badges |
| `CHANGELOG.md` | **Modify** | Add `### Added` entry under `## [Unreleased]` |

---

## Task 1: Playwright config

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Create the config**

Create `/Volumes/satechi/webdev/metaincognita-roulette/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    env: { PORT: '3100' },
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

**Important notes from codebase inspection:**
- `pnpm dev` runs `pnpm clean && nuxt dev` — the clean step deletes `.nuxt` and node_modules/.vite; first boot takes 10-20 s.
- The `PORT` env var is honored by the Nuxt dev server.
- `reducedMotion: 'reduce'` makes the wheel settle immediately (the wheel reads `window.matchMedia('(prefers-reduced-motion: reduce)')` in `onMounted`).

- [ ] **Step 2: Verify Playwright can parse the config (no TypeScript errors yet — just confirm the file exists)**

```bash
ls /Volumes/satechi/webdev/metaincognita-roulette/playwright.config.ts
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add playwright.config.ts
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "test(e2e): add Playwright config (chromium, reduced-motion, port 3100)"
```

---

## Task 2: E2E spec — money path + standalone pages

**Files:**
- Create: `e2e/money-path.spec.ts`

**Key selectors (verified against the running codebase):**

| What | Selector | Notes |
|---|---|---|
| "Take a seat" button | `getByRole('button', { name: /take a seat/i })` | `app/pages/index.vue:111` — UButton with `label="Take a seat"` |
| Outside bet — Red | `[data-zone="red:"]` | `app/components/wheel/RouletteMat.vue:225` |
| Staked readout | `text=Staked:` container / `getByText(/Staked:/)` | `BetControls.vue:3-4` |
| Spin button | `.spin-btn` | `BetControls.vue:10` |
| Result pill | `.result-pill` | `wheel.vue:22`; text is `"Won $X.XX"`, `"Lost $X.XX"`, or `"No win"` |
| Session key | `localStorage['roulette-session-v1']` | `roulette.config.ts:25` |
| Session stats | `.sessionStats.spins`, `.sessionStats.wageredCents` | `roulette.ts:51`, `sessionState.ts:10` |

**Session-gate mechanics (from wheel.vue:249-257):**
`onMounted` checks `store.phase === 'setup' && !store.loadFromLocalStorage()` — if both true, it calls `navigateTo('/')`. After clicking "Take a seat" and navigating to `/wheel`, the store is initialized and the session is written to localStorage. A reload re-reads localStorage and stays on `/wheel`.

**Standalone pages** (`/analysis`, `/learn`, `/lab`, `/drills`): each has an `<h1>` (verified in `app/pages/*.vue`). These routes do NOT require a session — only `/wheel` does.

- [ ] **Step 1: Create the e2e directory and spec**

```bash
mkdir -p /Volumes/satechi/webdev/metaincognita-roulette/e2e
```

Create `/Volumes/satechi/webdev/metaincognita-roulette/e2e/money-path.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('place a bet, spin, settle, and persist across reload', async ({ page }) => {
  // 1. Land on setup screen, start a session
  await page.goto('/')
  await page.getByRole('button', { name: /take a seat/i }).click()
  await expect(page).toHaveURL(/\/wheel/)

  // 2. Place an outside bet (Red)
  await page.locator('[data-zone="red:"]').click()
  await expect(page.locator('.staked-readout')).toContainText('$')

  // 3. Spin — with reducedMotion the wheel settles instantly
  await page.locator('.spin-btn').click()
  // Result pill shows "Won $X.XX", "Lost $X.XX", or "No win"
  await expect(page.locator('.result-pill')).toHaveText(/Won|Lost|No win/, { timeout: 8000 })

  // 4. Verify session stats persisted to localStorage
  const stats = await page.evaluate(() => {
    const raw = localStorage.getItem('roulette-session-v1')
    return JSON.parse(raw!).sessionStats
  })
  expect(stats.spins).toBe(1)
  expect(stats.wageredCents).toBeGreaterThan(0)

  // 5. Reload — session persists, stays on /wheel (not redirected to setup)
  await page.reload()
  await expect(page).toHaveURL(/\/wheel/)
  const spinsAfter = await page.evaluate(() => {
    const raw = localStorage.getItem('roulette-session-v1')
    return JSON.parse(raw!).sessionStats.spins
  })
  expect(spinsAfter).toBe(1)
})

test('standalone teaching routes render without a session', async ({ page }) => {
  for (const path of ['/analysis', '/learn', '/lab', '/drills']) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(path))
    await expect(page.locator('h1')).toBeVisible()
  }
})
```

**Why `.staked-readout` not `getByText(/Staked:/)`:** The `BetControls.vue` template wraps the staked line in `<span class="staked-readout">Staked: <span class="staked-amount">...</span></span>`. Using `.staked-readout` and `.toContainText('$')` is more resilient than matching on the literal "Staked:" label text, which could match elements in other contexts.

- [ ] **Step 2: Verify Vitest does NOT pick up the new spec**

Run the unit test suite and confirm count is still 134:

```bash
cd /Volumes/satechi/webdev/metaincognita-roulette && pnpm test 2>&1 | tail -20
```

Expected output contains something like:
```
Tests  134 passed (134)
```
And NO mention of `money-path.spec.ts`.

If Vitest does try to run the spec (it shouldn't — the projects config only matches `app/engine/**/*.test.ts` and `test/**/*.test.ts`), add an explicit `exclude` to `vitest.config.ts`:
```ts
export default defineConfig({
  test: {
    exclude: ['e2e/**'],   // add this line
    projects: [ ... ]
  }
})
```

- [ ] **Step 3: Commit**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add e2e/money-path.spec.ts
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "test(e2e): add money-path E2E spec (place, spin, settle, persist)"
```

---

## Task 3: .gitignore — Playwright artifacts

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add Playwright output dirs**

Append to `/Volumes/satechi/webdev/metaincognita-roulette/.gitignore`:

```
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

- [ ] **Step 2: Commit**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add .gitignore
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "chore: add Playwright artifact dirs to .gitignore"
```

---

## Task 4: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow directory and file**

```bash
mkdir -p /Volumes/satechi/webdev/metaincognita-roulette/.github/workflows
```

Create `/Volumes/satechi/webdev/metaincognita-roulette/.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          PORT: '3100'
          CI: 'true'
```

**Script names verified from `package.json`:**
- `pnpm lint` → `eslint .`
- `pnpm typecheck` → `NODE_OPTIONS=--max-old-space-size=8192 nuxt typecheck`
- `pnpm test` → `vitest run`
- `pnpm test:e2e` → `playwright test`

The `CI: 'true'` env is set explicitly so Playwright enables `forbidOnly`, `retries: 1`, and `workers: 1` as configured. `PORT: '3100'` is also passed but is already set in the `webServer.env` block; belt-and-suspenders on CI.

- [ ] **Step 2: Commit**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add .github/workflows/ci.yml
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "ci: add GitHub Actions CI workflow (lint, typecheck, unit, e2e)"
```

---

## Task 5: README CI badge

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add badge**

The existing badges in `README.md` are on lines like:
```
![version](https://img.shields.io/badge/version-0.1.0-d4a847)
![tests](https://img.shields.io/badge/tests-134%20passing-16a34a)
![typescript](https://img.shields.io/badge/typescript-strict-3178c6)
![license](https://img.shields.io/badge/license-MIT-1f6feb)
```

Add the CI badge as the FIRST badge (before `![version]...`) so CI status is the most prominent:

```markdown
![CI](https://github.com/cschweda/metaincognita-roulette/actions/workflows/ci.yml/badge.svg)
```

The line to insert before is `![version](https://img.shields.io/badge/version-0.1.0-d4a847)`.

- [ ] **Step 2: Commit**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add README.md
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "docs: add GitHub Actions CI badge to README"
```

---

## Task 6: CHANGELOG entry

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry under `## [Unreleased]` → `### Added`**

The current `## [Unreleased]` section starts at line 9 and already has a `### Added` block. Append to the end of the `### Added` list (before `### Changed`):

```markdown
- **Playwright E2E** for the money path (place → spin → settle → persist) plus a **GitHub Actions CI** workflow (lint · typecheck · unit tests · e2e) — the last two family-standard hardening steps.
```

- [ ] **Step 2: Commit**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add CHANGELOG.md
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "docs(changelog): note Playwright E2E and GitHub Actions CI under Unreleased"
```

---

## Task 7: Lint and typecheck validation

**Files:**
- Possibly modify: `tsconfig.json` or create `e2e/tsconfig.json` if the Playwright types conflict

- [ ] **Step 1: Run lint**

```bash
cd /Volumes/satechi/webdev/metaincognita-roulette && pnpm lint 2>&1
```

Expected: 0 errors. If the linter complains about `e2e/money-path.spec.ts` (e.g. unknown `test` / `expect` globals), check the ESLint config. The project uses `withNuxt` from `@nuxt/eslint`. Playwright's `test` and `expect` are not browser globals — they are imports, so ESLint should not flag them as undefined. If it does, add to `eslint.config.mjs`:

```ts
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    files: ['e2e/**/*.spec.ts'],
    rules: {
      // playwright test files may use these patterns
      'no-empty-pattern': 'off',
    },
  }
)
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Volumes/satechi/webdev/metaincognita-roulette && pnpm typecheck 2>&1
```

Expected: 0 errors. The project's `tsconfig.json` delegates entirely to `.nuxt/tsconfig.*.json`. Playwright types live in `node_modules/@playwright/test` — they are imported explicitly in the spec, so no ambient type augmentation is needed. The spec file is NOT in the Nuxt tsconfig's include paths, so it won't be type-checked by `nuxt typecheck`. This is correct behavior; the spec only needs to typecheck if you run `tsc` directly over the `e2e/` folder (which CI does not do).

If `nuxt typecheck` unexpectedly picks up `e2e/` and complains, create a local override:

```bash
cat > /Volumes/satechi/webdev/metaincognita-roulette/e2e/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["@playwright/test"]
  },
  "include": ["./**/*.ts"]
}
EOF
```

And ensure `e2e/` is NOT in any `include` glob that `nuxt typecheck` processes.

- [ ] **Step 3: If any fixes were needed, commit them**

```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette add -p
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "chore(e2e): fix lint/typecheck for Playwright spec and config"
```

---

## Task 8: Install Chromium and run E2E locally

- [ ] **Step 1: Install Chromium**

```bash
cd /Volumes/satechi/webdev/metaincognita-roulette && pnpm exec playwright install chromium 2>&1
```

This downloads the Chromium binary (~150 MB). It requires network access. If it fails due to sandbox/network restrictions, note the error and skip to Step 4 (CI will install it regardless).

Expected success output ends with:
```
chromium ✓  (playwright build v...)
```

- [ ] **Step 2: Run the E2E suite**

```bash
cd /Volumes/satechi/webdev/metaincognita-roulette && pnpm test:e2e 2>&1
```

The `webServer` block will boot `pnpm dev` (which runs `pnpm clean && nuxt dev`). This takes up to 2 minutes on first run. The `timeout: 120_000` in the config matches.

Expected output (abridged):
```
Running 2 tests using 1 worker

  ✓  [chromium] › money-path.spec.ts:3:1 › place a bet, spin, settle, and persist across reload
  ✓  [chromium] › money-path.spec.ts:35:1 › standalone teaching routes render without a session

  2 passed (...)
```

- [ ] **Step 3: If a test fails, diagnose**

Common issues and fixes:

| Symptom | Likely cause | Fix |
|---|---|---|
| `Timeout waiting for server` | `pnpm dev` boot > 120 s | Bump `timeout` in `webServer` to `180_000` |
| `Locator not found: .spin-btn` | Spin button disabled (no bet placed) | Confirm `[data-zone="red:"]` click registered a bet |
| `.result-pill` timeout | `reducedMotion` not taking effect | Confirm `reducedMotion: 'reduce'` is set in `use:` block |
| `loadFromLocalStorage()` returns false on reload | Session not written before reload | Add `await page.waitForTimeout(200)` before reload (last resort) |
| `h1` not visible on `/drills` etc. | Page needs JS hydration time | The `toBeVisible()` assertion waits by default — should be fine |

- [ ] **Step 4: Final confirmation — unit tests still 134**

```bash
cd /Volumes/satechi/webdev/metaincognita-roulette && pnpm test 2>&1 | tail -10
```

Expected:
```
Tests  134 passed (134)
```

No `money-path.spec.ts` in the output. If it appears, add `exclude: ['e2e/**']` to `vitest.config.ts` and re-run.

---

## Task 9: Squash into final commit

The task brief asks for a single commit `test(e2e): Playwright money-path E2E + GitHub Actions CI`. If the lead wants a single atomic commit, squash tasks 1-8 into one. Otherwise, the per-task commits above are fine.

To squash (count the commits added since the branch began — assuming this was worked on a clean branch):

```bash
# Count commits to squash — check git log first
git -C /Volumes/satechi/webdev/metaincognita-roulette log --oneline | head -10
```

Then if squashing is desired:
```bash
git -C /Volumes/satechi/webdev/metaincognita-roulette reset --soft HEAD~<N>
git -C /Volumes/satechi/webdev/metaincognita-roulette commit -m "test(e2e): Playwright money-path E2E + GitHub Actions CI"
```

Replace `<N>` with the number of commits made in tasks 1-8.

**If the lead does NOT want a squash** (they said "commit locally"), leave the per-task commits in place and just report the final HEAD hash.

---

## Self-Review Checklist

**Spec coverage:**
- [x] `playwright.config.ts` — Task 1
- [x] `e2e/money-path.spec.ts` money-path test — Task 2
- [x] `e2e/money-path.spec.ts` standalone smoke — Task 2
- [x] Vitest still finds 134, not e2e specs — Task 2 Step 2
- [x] `.gitignore` Playwright artifacts — Task 3
- [x] `.github/workflows/ci.yml` — Task 4
- [x] README CI badge — Task 5
- [x] CHANGELOG entry — Task 6
- [x] Lint clean — Task 7 Step 1
- [x] Typecheck clean — Task 7 Step 2
- [x] Chromium install + E2E run — Task 8
- [x] Single conventional commit — Task 9

**Placeholder scan:** No TBD/TODO/placeholder language found.

**Type/selector consistency:** `data-zone="red:"`, `.spin-btn`, `.result-pill`, `.staked-readout`, `roulette-session-v1`, `.sessionStats.spins`, `.sessionStats.wageredCents` — all verified against the actual source files in this codebase.
