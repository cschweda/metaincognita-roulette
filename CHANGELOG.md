# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Zero-adjacent bets on the single-zero mat** — the splits 0–1 / 0–2 / 0–3, the trios 0–1–2 and 0–2–3 (street odds), and the **First Four** 0-1-2-3 (corner odds), per the Crown Melbourne layout. Hotspots straddle the zero boundary and carry their table names ("Trio 0/1/2", "First Four") in labels and the EV explainer.
- A **"Biased wheel" badge** in the play-screen header whenever the Lab's rigged wheel is applied at the table — the app's honesty shouldn't stop at the Lab door.
- **Durable win/loss counters** in session stats. The W–L record previously derived from the 50-spin history window and drifted on longer sessions; old saved sessions migrate automatically.
- **Rebuys are logged** in the session log and CSV (new `event` column), so the bankroll column reconciles row-to-row instead of jumping unexplained after a buy-in.
- A **Discard button** on the setup page's resume banner — the explicit home for ending a saved session.
- **Drills score persists** (correct / total / streak) across visits and reloads under the training storage key.
- Playwright E2E for the mid-spin navigation regression, inside-bet hotspot placement, and the broke-modal rebuy flow.
- Playwright E2E for the money path + GitHub Actions CI.
- **Markers on the bankroll sparkline** at each spin, so you can see where the session turned up or down.
- **Confirmation toasts for every player action** — placing a bet, clearing, repeating, buying in, and toggling spin speed.
- A **Drills practice page** (`/drills`) — quiz-style payout and house-edge drills that reuse the engine to build bet literacy. Each question is generated deterministically from a seed (so it's reproducible and testable) and teaches the *why*: every bet on a wheel shares the same edge, single-zero beats double-zero, and Surrender softens the green pockets. Tracks streak and correct / total for the session.
- A **Realistic / Quick spin-speed toggle** in the play-screen header — persisted to localStorage so the preference survives page reloads. Realistic keeps the approved ~10 s feel; Quick settles in ~3.8 s.
- A **"Last spin" breakdown card** in the play-screen dashboard — a per-bet, won/lost summary (each bet's label, net, and the winning pocket) so it's obvious *why* you won or lost.
- A subtle **"ready to spin" pulse** on the Spin button when a bet is placed and a spin is possible (absolutely positioned — no button or layout shift).
- An **out-of-chips modal** when the bankroll hits $0 — buy more chips (re-buy the original buy-in, the loss still stands in your net), start a new session, or save the session to CSV and review it.
- The betting mat now **lights up every number a live bet covers**, additive across bets — bet Red and the red slots glow; add Even and the even slots join.
- **Inside combination bets** — splits, streets, corners, six-lines, and the American First Five — are now placeable on the mat (click or drag) via on-the-line hotspots, matching the bets the engine already prices.
- A **plain-language bet explainer** in the Expected Value card: every bet shows what it pays, the win amount, and the odds — e.g. "Black — pays 1:1, wins $5 if it hits (18 of 38)".

### Changed

- **Back from the table is no longer destructive.** It now simply returns to setup (the session autosaves on every action, and setup offers Resume / Discard); the old "Reset Session?" modal — whose only affirmative action wiped the session — is gone.
- The Lab's χ² verdict now uses the **Wilson–Hilferty** critical value (matches the 99.9% table within ±0.1) instead of a normal approximation that flagged ~1% of true wheels as biased.
- `coverage()` memoizes its pocket sets, cutting the betting-system simulator, Lab runs, and the million-spin fairness proof roughly in half (unit suite: ~6.2s → ~3.9s).
- Chip tray colors are assigned by tray position rather than hardcoded cent values, so re-tiering `rouletteConfig.chips` can't leave a chip unstyled.
- The app is now **fully responsive and playable down to 390px wide** (the family guideline) while staying perfect on tablet and desktop — no horizontal page scrolling at any width. The fixed-geometry betting mat **scales to fit** narrow screens (preserving every pixel-accurate inside-bet hotspot for click and drag), the wheel canvas shrinks fluidly, and the play-screen header and bottom navigation compact gracefully on small screens.
- The **Spin button** is now high-contrast casino gold instead of pink.
- Enlarged the **Staked** total and the ready-to-spin pulse for at-a-glance visibility.
- The ball clatters more visibly over the wheel deflectors as it settles.
- Moved the visual chip stack ("Your stack") beside the Spin button.
- The recent-results scoreboard is labeled **"Previous spins"** and no longer repeats the current number (shown big above).

### Fixed

- **Navigating away mid-spin no longer soft-locks the game.** The wheel now finishes (rather than abandons) an in-flight replay on unmount, so the round always settles: the bankroll commits, a result toast still fires, and returning to the table finds it playable instead of stuck on "Spinning…" until a hard reload.
- **Losses render with a minus sign.** `formatSignedCents(-500)` produced "$5" — session net and P&L showed losses distinguishable only by red color (a WCAG 1.4.1 use-of-color failure). Losses now read "−$5".
- The **"Running…" placeholder actually paints** before the Lab and betting-system simulators block the main thread (`nextTick` resolves pre-paint; they now yield through a real rAF+timer paint boundary).
- A cancelled pointer stream (browser gesture takeover, incoming call) no longer leaves a **ghost drag chip** stuck on screen with leaked listeners.
- Saved-session validation is stricter: negative bankrolls, unknown bet types, NaN/negative stakes, and bogus pocket numbers are rejected instead of flowing into the engine.
- Drills answer buttons no longer claim `role="radio"` without the arrow-key behavior that role promises — they are plain buttons.
- Accessibility: dropped a redundant `aria-label` on the Download CSV buttons (WCAG 2.5.3 label-in-name). The whole app is now **axe-clean (axe-core) and Lighthouse a11y 100** on every route.
- Toasts now update in place when several fire in quick succession (a stale `<Transition>` element could leave the previous message stuck on screen).

## [0.1.0] — 2026-06-14

The first fully playable release: a verified roulette engine wrapped in the
Metaincognita family trainer (Play · History · Analysis · Learn · Lab).

### Added — Engine (framework-free, sim-verified TypeScript)

- Regulated single- and double-zero wheel pocket orders and colors, pinned to the Arizona / Colorado / Melbourne rulebooks in [`docs/`](docs/).
- `mulberry32` seeded PRNG and integer-cent money helpers.
- Full bet pay table with coverage and settlement, including the American First Five basket and the **La Partage / En Prison / Surrender** even-money edge-reducers.
- Deterministic, seeded **forward-physics** landing model — the engine, not the renderer, decides the pocket.
- Event-driven round phase machine.
- **§2.4 fairness proof**: 1,000,000-spin χ² uniformity suite and edge-convergence tests (2.70% / 5.26% / 7.89% / 1.35%).
- **Exact expected-value calculator** — rule-aware house edge for any bet, computed by averaging the engine's own settlement over every pocket.
- **Betting-system simulator** — Flat / Martingale / D'Alembert / Fibonacci / Paroli, with risk-of-ruin, target-hit rate, and bankroll-fan percentile bands.

### Added — Trainer (Nuxt 4 app)

- Family chrome (top/bottom status bars, leave-confirm), dark mode, OG meta, casino design tokens, and a branded SPA loading screen (no white flash).
- Setup screen: variant/edge picker, stake tiers, and buy-in — defaulting to the American double-zero table.
- **Play screen**: a canvas roulette wheel that replays the engine's chosen pocket with a paced reveal; a clickable betting mat (inside + outside bets); a chip tray; click-to-place **and** drag-and-drop chip placement; the full place → spin → settle → bankroll loop with deduct-at-placement accounting.
- **Live expected-value advisor** on the play screen.
- Session stats panel (net P&L, W–L record, bankroll sparkline), a bankroll chip-stack that scales with the balance, and a mini bankroll sparkline in the play-screen header.
- **Toast notifications** for validation errors (e.g. "Place a bet before spinning") and win/loss results — auto-dismissing and click-to-close, with the result also kept in a fixed header pill until the next bet.
- **History** page: spin log + session summary, with downloadable session CSV (also available in the Lab).
- **Lab**: hardcore stats (realized vs theoretical edge, hot/cold pockets) and a wheel-condition sandbox (real-engine simulation, χ² verdict, apply a biased wheel to the table).
- **Analysis** page: house-edge reference, per-bet EV table, and the betting-system simulator with a bankroll-fan chart and outcome histogram.
- **Learn** page: how to play, strategy & psychology (prospect theory, the gambler's fallacy), and a detailed timeline history of roulette.
- MIT license, README with branded hero, and OG image (SVG + PNG).

### Changed

- Play screen made horizontal: top-aligned wheel/mat with the Session and Expected-value cards side by side, so a normal desktop shows everything without scrolling.
- Prominent large **Spin** button with Clear and Repeat beneath it.
- Page content centered in an equal-padded column (Learn / Analysis / Lab / History).

### Fixed

- You can never stake more than your bankroll — unaffordable chips are disabled for both click and drag, and the selected chip clamps down as the balance falls.
- Accessibility (WCAG AA): `html lang`, a `main` landmark, and `neutral-400` muted-text contrast (including the Lab); `/lab` is usable without an active session.
- `/wheel` renders reliably (explicit component imports); wheel + mat sit side by side; dev-server `PORT` handling and Vite pre-bundling.

[Unreleased]: https://github.com/cschweda/metaincognita-roulette/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cschweda/metaincognita-roulette/releases/tag/v0.1.0
