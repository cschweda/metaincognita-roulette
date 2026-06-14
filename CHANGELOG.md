# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A **"Last spin" breakdown card** in the play-screen dashboard — a per-bet, won/lost summary (each bet's label, net, and the winning pocket) so it's obvious *why* you won or lost.
- A subtle **"ready to spin" pulse** on the Spin button when a bet is placed and a spin is possible (absolutely positioned — no button or layout shift).

### Changed

- The **Spin button** is now high-contrast casino gold instead of pink.
- Enlarged the **Staked** total and the ready-to-spin pulse for at-a-glance visibility.
- The ball clatters more visibly over the wheel deflectors as it settles.
- Moved the visual chip stack ("Your stack") beside the chip tray to save vertical space.

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
