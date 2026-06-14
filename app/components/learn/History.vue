<template>
  <section
    aria-labelledby="learn-history-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-6 space-y-5"
  >
    <h2
      id="learn-history-heading"
      class="text-base font-semibold text-neutral-100"
    >
      The history of the little wheel
    </h2>

    <div class="space-y-4 text-sm leading-relaxed text-neutral-300">
      <p>
        <span class="text-neutral-100">Roulette</span> is simply French for "little wheel," and the
        little wheel has barely changed in two hundred years. Its story is full of mathematicians,
        gamblers, swindlers, and physicists — and almost everyone who ever truly beat it did so the
        same way. Here is how it got here.
      </p>
    </div>

    <!-- Vertical timeline -->
    <ol class="relative space-y-6 pl-6 sm:pl-8">
      <!-- The vertical spine -->
      <span
        class="absolute left-[5px] sm:left-[7px] top-1.5 bottom-1.5 w-px bg-neutral-800"
        aria-hidden="true"
      />

      <li
        v-for="entry in timeline"
        :key="entry.era"
        class="relative"
      >
        <!-- Node on the spine -->
        <span
          class="absolute -left-6 sm:-left-8 top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-neutral-900"
          aria-hidden="true"
        />
        <div class="rounded-md border border-neutral-800 bg-neutral-950/40 p-3.5 space-y-2">
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span class="font-mono text-xs font-semibold tracking-wide text-amber-300">
              {{ entry.era }}
            </span>
            <h3 class="text-sm font-semibold text-neutral-100">
              {{ entry.title }}
            </h3>
          </div>
          <p class="text-sm leading-relaxed text-neutral-300">
            <Prose :parts="entry.body" />
          </p>
        </div>
      </li>
    </ol>

    <div class="space-y-4 text-sm leading-relaxed pt-1">
      <p class="text-neutral-400">
        The wheel has barely changed in two hundred years because it never needed to — the green
        zero does all the work.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h, defineComponent, resolveComponent, type PropType, type VNode } from 'vue'

// The history is a vertical timeline. Each entry's `body` is a list of typed text segments rendered
// through a small render-function component (plain text, emphasis, mono zeros, and real internal
// NuxtLinks). No v-html anywhere, so there is no markup-injection surface — and the render function
// is immune to the whitespace-sensitivity of template-based inline markup.
interface Segment {
  text: string
  hi?: boolean // emphasised (brighter neutral)
  zero?: boolean // a green roulette zero
  red?: boolean // a red result
  mono?: boolean // monospace, no colour
  link?: string // internal route — rendered as a NuxtLink
}

interface TimelineEntry {
  era: string
  title: string
  body: Segment[]
}

// Renders a list of styled text segments inline. Authored strings may span multiple source lines,
// so each segment's whitespace is collapsed to single spaces before rendering.
const Prose = defineComponent({
  name: 'LearnHistoryProse',
  props: {
    parts: { type: Array as PropType<Segment[]>, required: true }
  },
  setup(props) {
    const NuxtLink = resolveComponent('NuxtLink')
    return () =>
      props.parts.map((part): VNode | string => {
        const text = part.text.replace(/\s+/g, ' ')
        if (part.link) {
          return h(
            NuxtLink,
            { to: part.link, class: 'text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors' },
            () => text
          )
        }
        if (part.hi) return h('span', { class: 'text-neutral-100' }, text)
        if (part.zero) return h('span', { class: 'font-mono text-emerald-300' }, text)
        if (part.red) return h('span', { class: 'font-semibold text-rose-300' }, text)
        if (part.mono) return h('span', { class: 'font-mono' }, text)
        return text
      })
  }
})

// Helpers keep the prose readable while staying fully typed.
const t = (text: string): Segment => ({ text })
const hi = (text: string): Segment => ({ text, hi: true })
const zero = (text: string): Segment => ({ text, zero: true })
const red = (text: string): Segment => ({ text, red: true })
const mono = (text: string): Segment => ({ text, mono: true })
const link = (text: string, to: string): Segment => ({ text, link: to })

const timeline: TimelineEntry[] = [
  {
    era: '1655',
    title: 'Blaise Pascal builds the ancestor',
    body: [
      t('The French mathematician '), hi('Blaise Pascal'),
      t(`, chasing a perpetual-motion machine, built a primitive spinning wheel that never made
        energy from nothing but did become the direct ancestor of roulette. The irony runs deep:
        Pascal also co-founded `), hi('probability theory'),
      t(` — the very mathematics that guarantees the house edge traces back to the same mind that
        built the wheel.`)
    ]
  },
  {
    era: '~1796',
    title: 'Paris: the modern game takes shape',
    body: [
      t(`In late-eighteenth-century France the modern game came together, blending older games like
        `), hi('Roly-Poly'), t(' and '), hi('Biribi'),
      t('. A description of a wheel in the '), hi('Palais Royal'),
      t(' from 1796 already notes two reserved bank slots — a single '), zero('0'),
      t(' and a '), zero('00'),
      t(`. The house advantage, in other words, was not a later addition. It was built into the game
        from the very beginning.`)
    ]
  },
  {
    era: 'Early 1800s',
    title: 'The zeros turn green',
    body: [
      t('The earliest wheels coloured the '), mono('0'), t(' red and the '), mono('00'),
      t(` black — which made them dangerously easy to confuse with the red and black betting colours.
        To clear up the confusion, both zeros were recoloured `), hi('green'),
      t(', the shade they have worn ever since.')
    ]
  },
  {
    era: '1843',
    title: 'The Blanc brothers cut the edge',
    body: [
      hi('François and Louis Blanc'),
      t(' launched a single-zero wheel — dropping the '), zero('00'),
      t(' entirely — at the '), hi('Bad Homburg'),
      t(` casino in Germany, halving the house edge to lure players from rival tables. The
        lower-edge `), hi('"European wheel"'),
      t(` was born. Legend says François struck a deal with the devil for the wheel's secrets;
        whether or not he did, the numbers 1 through 36 sum to exactly `), hi('666'),
      t(', which earned roulette its lasting nickname — "the Devil\'s Game."')
    ]
  },
  {
    era: '1863+',
    title: 'Monte Carlo becomes the capital',
    body: [
      t('François Blanc took over the casino at '), hi('Monte Carlo'),
      t(` in Monaco. When Germany banned gambling in 1872, Monte Carlo inherited Europe's gamblers
        and became the continent's gambling capital — with the single-zero wheel as its signature,
        and the Blanc family's fortune as proof the lower edge still paid.`)
    ]
  },
  {
    era: 'Early–mid 1800s',
    title: 'America keeps the double zero',
    body: [
      t('Roulette reached '), hi('New Orleans'),
      t(` with French immigrants and rode the riverboats up the Mississippi. American operators kept
        the double zero — and some early wheels even added a `), hi('third'),
      t(' house slot, an American Eagle — for a fatter cut. That choice is why the '),
      hi('"American wheel"'),
      t(' carries a 5.26% edge to this day, nearly double its European cousin.')
    ]
  },
  {
    era: '1873',
    title: 'Joseph Jagger breaks the bank',
    body: [
      hi('Joseph Jagger'),
      t(`, a Yorkshire engineer, hired clerks to secretly log thousands of outcomes at Monte Carlo.
        He spotted a `), hi('mechanically biased wheel'),
      t(' — a manufacturing imperfection that nudged certain numbers up — and bet it relentlessly, winning around '),
      hi('£60,000'),
      t(` (millions in today's money) before the casino began rotating its wheels to destroy the
        bias. He is living proof that a wheel's physical condition can be exploited. You can try the
        same hunt for a flawed wheel in the `),
      link('Lab', '/lab'), t('.')
    ]
  },
  {
    era: '1891',
    title: 'Charles Wells and the seduction of "systems"',
    body: [
      hi('Charles Wells'),
      t(` turned a few thousand francs into roughly a million over several days, "breaking the
        bank" — winning a table's entire cash reserve — again and again, and inspiring the
        music-hall song "The Man Who Broke the Bank at Monte Carlo." He claimed a winning `),
      hi('system'), t(', but it was almost certainly '), hi('luck'),
      t(`; he was later jailed for unrelated fraud. He remains a monument to two things at once: the
        wild reach of variance, and the eternal seduction of a system that isn't there.`)
    ]
  },
  {
    era: 'Late 1970s',
    title: 'The Eudaemons hide a computer in a shoe',
    body: [
      t('A group of physics students at '), hi('UC Santa Cruz'),
      t(' — among them the future chaos-theory pioneers '), hi('Doyne Farmer'),
      t(' and '), hi('Norman Packard'),
      t(` — concealed a small computer in a shoe to predict where the ball would land, timing the
        wheel and ball to attack the `), hi('physics'),
      t(` of the spin rather than the odds of the bets. In principle the edge was enormous; in
        practice the hardware kept failing. Their story is told in Thomas Bass's `),
      hi('"The Eudaemonic Pie."')
    ]
  },
  {
    era: '1990s',
    title: 'García-Pelayo wins in court',
    body: [
      hi('Gonzalo García-Pelayo'),
      t(`, a Spaniard, recorded thousands of spins to find biased wheels in Madrid and Las Vegas,
        winning over `), hi('a million dollars'),
      t(` with his family. The casinos sued — and the Spanish courts sided with him. Using your own
        brain and the casino's own imperfect equipment, the courts ruled, is not cheating.`)
    ]
  },
  {
    era: '2004',
    title: 'Ashley Revell bets everything on red',
    body: [
      hi('Ashley Revell'),
      t(' sold nearly everything he owned and put about '), hi('$135,000'),
      t(' — his entire net worth — on red at a Las Vegas casino. The ball landed on '),
      red('Red 7'), t(', and he walked away with roughly '), hi('$270,000'),
      t(`. It was the purest one-decision gamble ever televised, and a living lesson in prospect
        theory: a single huge loss feared, a single huge gain hoped for, the slow math ignored
        entirely.`)
    ]
  },
  {
    era: 'Today',
    title: 'The wheel wins by staying honest',
    body: [
      t(`Modern wheels are machined to tight tolerances, rotated and maintained to kill any bias,
        and "no more bets" is now called `), hi('early'),
      t(' to defeat anyone timing the physics. On better tables, '), hi('La Partage'), t(', '),
      hi('En Prison'), t(', and '), hi('Surrender'),
      t(' rules soften the even-money edge. And the lesson of the whole history is this: the only people who ever beat roulette attacked a '),
      hi('flawed wheel'), t(' or the '), hi('physics'),
      t(` of the spin — never the math of the bets, because the math of the bets cannot be beaten.`)
    ]
  }
]
</script>
