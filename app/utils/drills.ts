import { PAYOUTS, coverage, type Bet, type BetType } from '../engine/bets'
import { pocketCount } from '../engine/wheel'
import { edgePct } from '../engine/ev'
import { mulberry32, type Rng } from '../engine/prng'
import { betLabel } from './betLabel'

export type DrillKind = 'payout' | 'edge'

export interface DrillQuestion {
  kind: DrillKind
  prompt: string
  choices: string[] // 3–4 options
  correctIndex: number // index into choices
  explanation: string // shown after answering — teach the why
}

// Every drill is framed on a consistent wheel so the teaching stays honest.
// Payout questions use the American (double-zero) table because the First Five
// basket only exists there, and the "house always wins" point lands harder at
// 5.26%. Edge questions name their own wheels explicitly.
const PAYOUT_VARIANT = 'double'
const PAYOUT_EDGE_PCT = 5.26 // every standard double-zero bet shares this edge

// Bet types with mutually distinct payouts, so distractors never collide with
// the correct answer or each other. firstFive(6) is double-zero only.
const PAYOUT_TYPES: BetType[] = [
  'straight', // 35
  'split', //    17
  'street', //   11
  'corner', //    8
  'firstFive', //  6
  'sixline', //   5
  'column', //    2
  'red' //        1
]

/** Canonical example numbers for a bet type, used for coverage + labels. */
function exampleNumbers(type: BetType): number[] | (number | '00')[] {
  switch (type) {
    case 'straight': return [7]
    case 'split': return [7, 8]
    case 'street': return [7, 8, 9]
    case 'corner': return [7, 8, 10, 11]
    case 'firstFive': return [0, '00', 1, 2, 3]
    case 'sixline': return [7, 8, 9, 10, 11, 12]
    case 'column': return [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
    case 'red': return []
    default: return []
  }
}

function betOf(type: BetType): Bet {
  return { type, numbers: exampleNumbers(type) as Bet['numbers'], stakeCents: 500 }
}

/** Deterministic integer in [0, n). */
function pick(rng: Rng, n: number): number {
  return Math.floor(rng() * n)
}

/** Fisher–Yates shuffle driven by the seeded rng (does not mutate the input). */
function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = pick(rng, i + 1)
    ;[out[i]!, out[j]!] = [out[j]!, out[i]!]
  }
  return out
}

function makePayoutQuestion(rng: Rng): DrillQuestion {
  const type = PAYOUT_TYPES[pick(rng, PAYOUT_TYPES.length)]!
  const bet = betOf(type)
  const label = betLabel(bet)
  const correctPayout = PAYOUTS[type]

  // Draw 3 distinct distractor payouts from the *other* types' payouts.
  const distractorPool = PAYOUT_TYPES
    .map(t => PAYOUTS[t])
    .filter(p => p !== correctPayout)
  const distractors = shuffle(rng, distractorPool).slice(0, 3)

  const correctChoice = `${correctPayout}:1`
  const choices = shuffle(rng, [correctChoice, ...distractors.map(p => `${p}:1`)])
  const correctIndex = choices.indexOf(correctChoice)

  const coverageCount = coverage(bet).size
  const total = pocketCount(PAYOUT_VARIANT)
  const win = 5 * correctPayout

  const prompt = `On an American (double-zero) wheel, what does a ${label} bet pay?`
  const explanation
    = `A ${label} covers ${coverageCount} of the ${total} numbers and pays ${correctPayout}:1 — `
      + `a $5 chip wins $${win}. Remember: nearly every bet on this wheel carries the same `
      + `~${PAYOUT_EDGE_PCT}% house edge; only the swing differs.`

  return { kind: 'payout', prompt, choices, correctIndex, explanation }
}

/** A labelled bet option for an edge question. */
interface EdgeOption {
  text: string
  edge: number
}

function pct(n: number): string {
  return `${n.toFixed(2)}%`
}

function makeEdgeQuestion(rng: Rng): DrillQuestion {
  const form = pick(rng, 3) // 0 = same wheel diff bets, 1 = single vs double, 2 = surrender
  const prompt = 'Which is the better bet — the lower house edge?'

  let options: EdgeOption[]
  let identical = false
  let explanation: string

  if (form === 0) {
    // (a) Two different bet TYPES on the SAME (single-zero) wheel → identical edge.
    const straight = betOf('straight')
    const red = betOf('red')
    const eStraight = edgePct(straight, { variant: 'single', evenMoney: 'none' })
    const eRed = edgePct(red, { variant: 'single', evenMoney: 'none' })
    options = [
      { text: `${betLabel(straight)} (single-zero)`, edge: eStraight },
      { text: `${betLabel(red)} (single-zero)`, edge: eRed }
    ]
    identical = Math.abs(eStraight - eRed) <= 0.01
    explanation
      = `Both are ${pct(eStraight)} — on a fair wheel every bet has the same expected loss; `
        + `only the variance changes. A straight-up swings wildly; red barely moves. `
        + `Neither is "better".`
  } else if (form === 1) {
    // (b) Same even-money bet on European (single) vs American (double) → European.
    const eRed = edgePct(betOf('red'), { variant: 'single', evenMoney: 'none' })
    const aRed = edgePct(betOf('red'), { variant: 'double', evenMoney: 'none' })
    options = [
      { text: 'Red on a European (single-zero) wheel', edge: eRed },
      { text: 'Red on an American (double-zero) wheel', edge: aRed }
    ]
    explanation
      = `Single-zero is ${pct(eRed)} vs double-zero ${pct(aRed)} — the extra green pocket `
        + `roughly doubles the cost. Same bet, same payout, twice the edge: always pick the `
        + `single-zero wheel.`
  } else {
    // (c) American vs American + Surrender → Surrender.
    const plain = edgePct(betOf('red'), { variant: 'double', evenMoney: 'none' })
    const surrender = edgePct(betOf('red'), { variant: 'double', evenMoney: 'surrender' })
    options = [
      { text: 'Red on a plain American wheel', edge: plain },
      { text: 'Red on an American wheel with Surrender', edge: surrender }
    ]
    explanation
      = `Surrender hands back half your even-money stake when a zero hits, cutting the edge `
        + `from ${pct(plain)} to ${pct(surrender)}. The payout is unchanged — the rule just `
        + `softens the green pockets.`
  }

  // Every edge question carries the "They're identical" option. In form (a)
  // it's the correct answer (the bets really are equal); in forms (b)/(c) it's
  // a deliberate decoy — the zero count or the rule genuinely changes the edge,
  // and recognising that is the lesson.
  const identicalText = 'They\'re identical'
  const optionTexts = shuffle(rng, options).map(o => o.text)
  const choices = shuffle(rng, [...optionTexts, identicalText])

  let correctIndex: number
  if (identical) {
    correctIndex = choices.indexOf(identicalText)
  } else {
    const lowest = options.reduce((best, o) => (o.edge < best.edge ? o : best), options[0]!)
    correctIndex = choices.indexOf(lowest.text)
  }

  return { kind: 'edge', prompt, choices, correctIndex, explanation }
}

/**
 * Deterministically generate a teaching drill from a seed. Same seed → same
 * question (every source of randomness flows through mulberry32). The seed's
 * low bit selects the kind so a session alternates payout / edge as it counts up.
 */
export function makeDrillQuestion(seed: number): DrillQuestion {
  const rng = mulberry32(seed)
  const kind: DrillKind = seed % 2 === 0 ? 'payout' : 'edge'
  return kind === 'payout' ? makePayoutQuestion(rng) : makeEdgeQuestion(rng)
}
