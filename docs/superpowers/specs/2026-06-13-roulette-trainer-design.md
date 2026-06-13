# Metaincognita Roulette — Design Spec

**Status:** draft for review · **Date:** 2026-06-13 · **Author:** brainstormed with Claude
**Family standard:** conforms to `docs/METAINCOGNITA-GUIDELINES-v1.1.md`
**Brainstorm artifact:** the validated physics/visual prototype lives in
`.superpowers/brainstorm/.../content/wheel-physics-v6.html` (forward-physics wheel, fairness lab, betting mat).

---

## 1. What we're building — and the trainer thesis

A single-player, money-free **roulette simulator that is fun to play and teaches the real
mathematics of the game.** It looks and feels like a real wheel spinning, and it is honest about
why you cannot beat it.

Roulette is unlike blackjack: **there is no optimal strategy to learn.** Every bet on a fair wheel
carries the same house edge, no decision improves it, and no betting system overcomes it. That makes
the teaching mission unusually pure — the trainer's job is to make the player *feel and understand*
three truths that casinos count on players never internalizing:

1. **The edge is in the pay table, not the wheel.** A straight-up number pays 35:1 when true odds
   are 36:1 (single-zero) / 37:1 (double-zero). The green zero(s) are the entire house edge, present
   on a perfect wheel.
2. **Every bet is the same bad deal.** Bet selection changes *variance*, never *expectation*
   (one exception — the American "First Five" basket, which is strictly worse).
3. **The only real crack is physical, and it's nearly extinct.** Wheel bias and ball/dealer-signature
   prediction are the only methods that ever beat roulette — and modern casinos engineer them away.
   Betting systems never worked and never will.

The flagship feature — a true **forward-physics wheel** — is what lets us teach #3 viscerally:
the same engine that runs the game can be detuned in the Lab to show a biased wheel bloom, exactly
the phenomenon Jagger and Hibbs/Walford exploited.

## 2. Primary sources (the §1 "Authentic" commitment)

All three are committed to `docs/` and cited inline in the engine where used.

| Source | File | What it anchors |
|---|---|---|
| **Arizona Tribal-State Gaming Compact, Appendix F(5)** | `Appendix F(5) - Generic_0.pdf` | Both wheel pocket orders (§L); the full bet set & **pay table**; placement geometry; ≥4-revolution / opposite-spin rule; $100,000 max wager; wheel-bias inspection mandate. |
| **Crown Melbourne Roulette Rules v10.0 (VCGLR)** | `387643885-…-Version-10-0-pdf.pdf` | Wheel & mat **diagrams** (D=single-zero wheel, G=double-zero wheel, A/F=mats, E/H=placement, C=racetrack); single-zero / double-zero / **French** variants; racetrack **call bets** (Voisins/Tiers/Orphelins/Jeu Zéro/Neighbours); no-spin irregularities; "dolly". |
| **Colorado Limited Gaming Rule 22** | `817279370-Rule22-101520.pdf` | Confirms wheels & pay table cell-for-cell; the **"In Prison" rule** (even-money edge-reducer); **crown/dolly** definition; 00-wheel-as-single-zero procedure; proprietary side-bet variants (noted out of scope). |

The three agree on every number — wheel orders, colors, and payouts are corroborated across
jurisdictions, which is exactly the cross-source confidence the family standard wants.

## 3. Game model & variants

**Two wheels, both shipped:**

- **Single-zero (European / French / "High Limit")** — 37 pockets. House edge **2.70%** on every bet.
  Clockwise order (Diagram D):
  `0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26`
- **Double-zero (American)** — 38 pockets. House edge **5.26%** on every bet (the basket is worse).
  Clockwise order (Diagram G):
  `0,28,9,26,30,11,7,20,32,17,5,22,34,15,3,24,36,13,1,00,27,10,25,29,12,8,19,31,18,6,21,33,16,4,23,35,14,2`

**Reds** (both wheels): `1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36`; the rest black; zero(s) green.

**Configurable rule presets** (each labeled with its edge so the player sees the cost of the table
they chose):

| Preset | Wheel | Even-money rule | Even-money edge |
|---|---|---|---|
| American | double-zero | none | 5.26% (basket 7.89%) |
| European | single-zero | none | 2.70% |
| European + La Partage | single-zero | lose half on 0 | **1.35%** |
| European + En Prison | single-zero | bet imprisoned on 0 | **1.35%** |
| American + Surrender | double-zero | lose half on 0/00 | **2.63%** |

La Partage / En Prison / Surrender / "In Prison" apply to even-money bets only and are the single
biggest lever a player actually controls — choosing the table, not the bet. The trainer surfaces
this relentlessly.

## 4. The wheel & the physics engine — the centerpiece

**Decision (locked with the user): the forward physics simulation is the source of truth for the
outcome.** Wherever the ball physically settles *is* the result. This was chosen over
"RNG picks the pocket, animation follows" because the goal is a wheel that is real "for the same
reason a real wheel is real."

This is reconciled with the family's seeded/reproducible/verified requirements (§4) as follows:

- **Seeded initial conditions → deterministic sim → reproducible.** One injectable PRNG (mulberry32;
  crypto-seeded in live play via a single continuous stream, fixed-seeded in tests/sims) supplies
  the launch conditions (ball speed, rotor speed, release angle/phase, timing). The integrator is
  deterministic, so a seed reproduces a spin exactly.
  *(The prototype's "6 black on repeat" bug came from re-seeding per spin with consecutive integers;
  the fix — one continuous stream — is now part of the contract.)*
- **Fairness is PROVEN, not assumed.** A statistical-simulation suite runs ≥1M (target **5M**)
  headless spins per preset and gates release on a **χ² uniformity test** (within ~3–3.5σ) plus
  convergence of the measured house edge to theory (**2.70% / 5.26% / 7.89%**, pinned cell-for-cell).
  This is the §2.4 proof — and for a physics-truth wheel it is a *real scientific claim*, not a
  rubber stamp: it is our equivalent of a casino's wheel-inspection report.
- **Fallback governor (documented, not hidden).** If the raw model cannot pass χ² within a reasonable
  tuning budget, a statistically-invisible correction is applied *only* at the final fret-settle
  (resolving genuinely-ambiguous adjacent-pocket ties toward long-run balance). Its existence is
  documented in the engine and the learn page; it is never secret.
- **Bias is a first-class Lab feature, never a silent bug.** The same model, detuned (tilt, a
  dominant diamond, worn frets), produces a measurable bias — the teaching payload of the Lab.

**The physics model — a 2.5D treatment, owned by the engine (pure TypeScript):**

- The authoritative physics lives in `app/engine/` as deterministic, seeded, framework-free
  TypeScript — so it runs headless in the χ² simulation and Node tests, and so the *engine*, not a
  renderer, decides the pocket. (This is why we do **not** let a UI physics library decide outcomes:
  a second, divergent simulation in the view would break both reproducibility and the fairness proof.)
- Pachinko is pure 2D gravity; roulette is a ball on a **banked track spiraling down a cone onto a
  counter-rotating rotor** — not pure 2D. So the model is **angular dynamics in the wheel plane**
  (friction decay, the 8 diamonds, fret scatter) **+ a kinematic radius/height curve** for the bowl
  descent — hand-implemented and deterministic, which is more rigorous for our purposes than an
  off-the-shelf solver whose cross-platform determinism we'd have to fight.
- Phases: (1) **ball on the track**, decelerating by friction, ≥4 revolutions, spun opposite the
  rotor; (2) **separation** when centripetal support fails, spiraling inward; (3) **diamond/deflector
  collisions** (8 diamonds) — the chaotic, sensitive-dependence step; (4) **fret scatter** among
  pocket dividers on the moving rotor; (5) **settle** — final pocket read from ball position relative
  to the rotor.
- **Validated feel** (from the prototype, user-approved): perfect-circle top-down render with a
  weighted, shaded ball; ~7–9 revolutions over ~10s with a decelerating launch; rest position seated
  inward of the number so both ball and number read; winning pocket marked (the **dolly**).
  Real launch speed is faster (~3–5 rev/s); we default slower for watchability with a
  realistic↔relaxed speed setting.

**Render:** the UI **replays the engine's computed trajectory** (it never re-derives the outcome).
Renderer is Phaser or a hand-rolled canvas (the prototype proves canvas suffices; Phaser buys family
consistency with pachinko) — matching the prototype geometry: wood rim, banked ball track, 8 diamonds,
colored pocket ring in canonical order, center cone/turret, dolly on the winner.
`prefers-reduced-motion` snaps to the result with no animation.

## 5. Bets, payouts, layout, racetrack

**Pay table (identical across all three sources):**

| Bet | Covers | Pays |
|---|---|---|
| Straight up | 1 | 35:1 |
| Split | 2 | 17:1 |
| Street (three) | 3 | 11:1 |
| Corner (four) | 4 | 8:1 |
| First Five *(double-zero only: 0,00,1,2,3)* | 5 | 6:1 |
| Six line | 6 | 5:1 |
| Column | 12 | 2:1 |
| Dozen | 12 | 2:1 |
| Red / Black / Odd / Even / 1–18 / 19–36 | 18 | 1:1 |

**Inside-bet placement** is geometric (chip on a square / line / corner / row-end), pinned to
Diagrams E & H — including the special three-number combos `(0,1,2) (0,2,00) (00,2,3)` and the
First-Five corner.

**Mat:** standard horizontal layout (validated in prototype, user-approved), generated for the
active variant (0 vs 0/00). Hover shows coverage + payout. Money is **integer cents**; payout
rounding follows the cited rulebooks.

**Racetrack / French call bets** (Diagram C; single-zero) — *v1.2, see phasing*:
Voisins du Zéro, Tiers du Cylindre (Series 5/8), Orphelins (Orphans), Jeu Zéro (Zero Game),
Neighbours (a number ± 2 neighbors on the wheel). These are *wheel-sector* bets, so they double as a
teaching bridge between the layout and the physical wheel.

## 6. Architecture (§4 code theory)

- **Engine purity.** Pure TypeScript under `app/engine/`; nothing imports Vue/Nuxt/Pinia. Node-unit-
  testable, re-skinnable. CI greps for violations.
- **Event-driven rounds.** Synchronous phase machine emits typed events
  (`bets-open → no-more-bets → ball-spun → ball-settled → settled`); the UI drains them through a
  pacing queue into presented state. Amounts/legality read from engine state; what the player has
  "seen" reads from presented state — paced animation can't leak the result.
- **Seeded randomness.** One injectable PRNG (mulberry32); crypto-seeded continuous stream live,
  fixed-seeded in tests/sims. Every spin reproducible from its seed.
- **Money is integer cents.** No floats in wagers/payouts/bankroll.
- **Computed, not transcribed.** Edges, the pay table's implied edges, and distributions are derived
  by the engine and *pinned* against the published references in tests.
- **Versioned persistence.** `roulette-session-v1` (single key, version field, validate+sanitize on
  load, corrupt→clean reset, quota-fail→in-memory + visible warning, mid-round refresh restores exact
  state). Lifetime training stats under `roulette-training-v1`, surviving "leave table".
- **Trust engine output, not fixtures.** Display/summary logic tested against the engine's real
  emitted shapes. Every UI phase ends with a live **browser smoke** (the discipline that already
  caught the prototype's seeding and layout bugs).

## 7. The trainer (the §2.3 formula, reframed for a no-strategy game)

The loop is the family-standard *advisor → per-decision feedback → outcome → history → analysis →
learn → drills*, but its content is reframed because there is no winning play:

- **Advisor** (before the spin): for every chip on the layout, the **true expected cost** and the
  bet's house edge; the **session EV** ("at this action rate, expected loss ≈ $X/hr"); and a flag
  when the player is drifting into a **betting-system trap** (escalating after losses = Martingale;
  chasing a "due" number = gambler's fallacy). It never says "bet this to win" — that bet does not
  exist; it says "here is what this costs."
- **Per-decision feedback** (recorded, not just shown): grades each round against the only things that
  *are* gradable — did the player pick a worse-than-necessary table/bet (e.g. American basket, or
  double-zero when single-zero was available)? Are they escalating into ruin? `DecisionRecord` logs it.
- **Outcome explanation:** when the ball settles, say what hit, which bets won/lost and why, and the
  net — at center-felt where the eyes already are; the dolly marks the number.
- **History:** complete persisted log of spins and graded decisions.
- **Analysis:** EV-lost-vs-actual-P&L (the "variance is loud, expectation is quiet" chart), bankroll
  curve, most-repeated mistakes, system-trap incidence.
- **Learn** (see §README): history, math, myths, glossary — computed from the engine where possible.
- **Drills:** payout reflexes (what does a corner on 5 pay?), spot-the-equal-EV-bet, fallacy-spotting,
  and "survive N spins" bankroll discipline — mistake-seeded from the player's own record.

## 8. The Lab — roulette's killer feature (§2.5)

Three experiment surfaces, all driven by the *real engine* in a web worker with progress:

1. **The physics sandbox** (unique to our physics-truth wheel): induce a **tilt / dominant diamond /
   worn frets** and watch the χ² fail and a sector bias bloom over thousands of spins; explore
   **dealer signature** and **sensitive dependence** (tiny launch change → different pocket).
   This is the visceral version of "why physical conditions impact the win rate."
2. **Betting-system simulators:** Martingale, D'Alembert, Fibonacci, Labouchère — run 500+ bankroll
   lifetimes and show the truth: identical long-run EV, with the systems merely trading many small
   wins for rare catastrophic losses (risk-of-ruin, table-limit walls).
3. **Variance & survival:** closed-form expectation/variance, N0 (spins to overcome variance), and
   **risk of ruin**, with empirical bankroll fan charts (p5/p25/p50/p75/p95).

Advanced advantage-play modules (bias clocking, prediction) are growth, but the engine supports them
from day one.

## 9. UI / UX standard (§5)

Identical Metaincognita chrome (slim top status bar; bottom nav History · Analysis · Learn · Drills;
version + GitHub link; "leave" confirms). **Custom felt = the wheel (Phaser) + the mat.** Casino-luxury
tokens (felt `#0a5c36`, walnut, gold `#d4a847`, cream, chip palette). Fira Code for every number/EV.
Keyboard play end-to-end with on-button hints (Space spin, R rebet, C clear, number-grid focus).
**Study mode** pauses and exposes hotspots explaining every zone with its edge. Accessibility: aria-live
for everything a dealer announces ("no more bets", the winning number), full keyboard operability with
managed focus, axe-clean AA, `prefers-reduced-motion` disarms the spin. Mobile playable at 390px (wheel
scales; bet history → status chips). Per-game accent set in `app.config.ts`.

## 10. Tech stack & structure

Family stack: **Nuxt 4 · Vue 3 · Nuxt UI 4 · Tailwind 4 · Pinia · TypeScript · pnpm · Vitest ·
Playwright · Netlify static · dark-only**. The wheel **renderer** is Phaser 3 (mirroring
`metaincognita-pachinko`) or a hand-rolled canvas — a presentation choice, since the authoritative
physics is pure TS in `app/engine/` and the renderer only replays it (no physics library decides
outcomes). Engine under `app/engine/` (pure TS, no Vue/Nuxt/Pinia/Phaser imports). Start by cloning the
craps skeleton and porting holdem `main.css` tokens (table game).

## 11. Build methodology & phasing (§3)

Each plan is spec → complete-code plan → task-by-task with review. **v1** = Plans 1–5.

1. **Engine + simulation proof.** Variants, bets, payouts, settlement, rule presets (La Partage/En
   Prison/Surrender), the forward-physics wheel model, seeded PRNG, integer cents. TDD throughout;
   ≥1M-spin χ² fairness + edge-convergence suite pinned to 2.70%/5.26%/7.89% **before any UI**.
2. **Game UI.** Setup → Phaser wheel + mat → chip placement → spin → settle → bankroll → versioned
   persistence + mid-round restore. Ends with browser smoke.
3. **Trainer surfaces.** Advisor, per-decision feedback, outcome, history, analysis.
4. **Learn page + core Lab + drills.** README essay; `/learn` (history tab, engine-computed edges,
   myths); Lab modules 2 & 3 (systems + variance) and the physics sandbox (module 1); drill set.
5. **Hardening.** Mobile, a11y (axe AA), Playwright E2E for money paths, og-image (SVG+PNG), badges,
   Netlify deploy + family CSP, README hero + family footer.

**Fast-follows (v1.x):** racetrack/call bets (v1.2); advanced advantage-play Lab; speed setting polish.

## 12. Testing & verification

Unit (engine + components), `lint`, `typecheck` green before every commit. **Simulation proofs**
(χ² uniformity per preset; edge convergence pinned cell-for-cell). Playwright E2E for the money paths
(place → spin → settle → persistence/restore). axe-clean WCAG 2.1 AA on every route. **Browser smoke**
ending every UI phase — drive the real app, watch the console, confirm the rendered winner matches the
engine's settled pocket (the discipline that already caught two prototype bugs). Conventional commits,
no AI-attribution trailers; semver + Keep-a-Changelog.

## 13. README learning section (priority topic: wheel drift)

Per the user's request, the README essay and `/learn` **lead with the surprising truth**: physical
conditions move the win rate. Required coverage:

- **Why the game is unbeatable by design** — the edge is in the pay table (the green zero), present on
  a perfect wheel; every bet is the same expectation; betting systems can't change a single bet's EV.
- **Why the wheel's *physical* condition is the one real crack** — bias from loose/worn frets, tilt,
  track wear; the famous winners (Joseph Jagger, Monte Carlo 1873; Hibbs & Walford, Reno 1947);
  physical prediction (Thorp & Shannon's 1961 wearable computer; the Eudaemons); and how casinos now
  seal the crack (precision wheels, rotation, fret swaps, statistical surveillance — echoing the
  Arizona/Colorado inspection mandates).
- **Why people play a game they can't beat** — the honest behavioral layer: the expected loss is the
  *price of entertainment*, not a failed investment; people buy variance and the dream of the upside
  (prospect theory — small probabilities overweighted, losses chased); casinos engineer the
  misperception (near-misses, comps, no clocks). The trainer's stance: play with eyes open — know the
  price, know no system changes it, know wins are variance not skill — so "$100 for a fun night" is an
  *informed* choice. This is also where responsible-play guidance lives.
- **Tidbits, variations** (American vs European vs French; La Partage/En Prison/Surrender and the edge
  they buy back), and **the mathematics** inline (edge derivation, variance, system debunking).

Deep research → `docs/appendix-a-history.md` (the pachinko notes-to-essay pipeline).

## 14. Out of scope / YAGNI

Real money, accounts, server play, analytics, external runtime calls. Multiplayer. Live multi-table
tournaments (a solo "tournament drill" may come later). **Proprietary side bets** (Back2Back, Straights
& 8's, Spinner Winner — trademarked; Crown's Lucky Symbols) — excluded; a generic side-bet framework is
possible growth, but flair never lies about the math.

## 15. Open questions

1. **Default preset** on first load — European (kinder 2.70%, better first impression) vs American
   (the table most US players actually meet)? Recommendation: **European**, with the variant picker
   prominent and the edge shown.
2. **Phaser vs canvas for the replay renderer** — Phaser buys family consistency with pachinko; the
   prototype proves a hand-rolled canvas is sufficient and lighter. (Either way the physics is pure-TS
   in the engine; this is purely a rendering choice.) Recommendation: **Phaser**, unless its bundle
   weight isn't worth it for one wheel scene.
3. **Racetrack in v1 or v1.2?** Recommendation: **v1.2**, to keep v1 focused on the core wheel + mat
   + trainer + Lab.
