<template>
  <section
    aria-labelledby="learn-how-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-6 space-y-5"
  >
    <h2
      id="learn-how-heading"
      class="text-base font-semibold text-neutral-100"
    >
      How roulette works
    </h2>

    <div class="space-y-4 text-sm leading-relaxed text-neutral-300">
      <p>
        Roulette is simple to watch and simpler to play. A wheel is divided into numbered
        pockets, a small ball is set spinning, and wherever it comes to rest decides who wins.
        Everything else — the chips, the colours, the patter at the table — is dressing on that
        one event.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        The wheel
      </h3>
      <p>
        There are two wheels in the world. A <span class="text-neutral-100">European wheel</span>
        has <span class="text-neutral-100">37 pockets</span>: the numbers 1 through 36, plus a
        single green <span class="font-mono text-emerald-300">0</span>. An
        <span class="text-neutral-100">American wheel</span> has
        <span class="text-neutral-100">38</span> — it keeps everything on the European wheel and
        adds a second green pocket, the double zero
        <span class="font-mono text-emerald-300">00</span>. That extra green pocket is the only
        meaningful difference between the two, and as you will see, it doubles the price of playing.
      </p>
      <p>
        At a live table the croupier spins the wheel in one direction and rolls the ball the other
        way around the rim. The ball loses speed, drops off the track, rattles across the frets,
        and settles into a pocket. The number and colour of that pocket settle the round. On a
        well-maintained wheel every pocket is equally likely — there is no pattern to read and
        nothing the ball "remembers."
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        Inside bets and outside bets
      </h3>
      <p>
        You bet by placing chips on the layout — the printed grid of numbers beside the wheel.
        Wagers fall into two families.
        <span class="text-neutral-100">Inside bets</span> sit on the numbers themselves: a single
        number, or the line or corner shared by a small group of them. They are long shots that pay
        a lot. <span class="text-neutral-100">Outside bets</span> sit around the edge and cover big
        blocks at once — red or black, odd or even, high (19–36) or low (1–18), a dozen
        (1–12, 13–24, 25–36), or a column. They win often and pay little. Both families, it turns
        out, cost you exactly the same in the long run.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        What each bet pays
      </h3>
      <p>
        Payouts are quoted against your stake — "35:1" means you keep your chip and collect
        thirty-five more. The fewer numbers a bet covers, the bigger the payout, in near-perfect
        lockstep:
      </p>

      <div class="overflow-x-auto -mx-1">
        <table class="w-full text-sm border-collapse">
          <caption class="sr-only">
            Roulette payouts by bet type
          </caption>
          <thead>
            <tr class="border-b border-neutral-800 text-left">
              <th
                scope="col"
                class="py-2 pr-3 pl-1 text-[10px] uppercase tracking-widest text-neutral-400 font-medium"
              >
                Bet
              </th>
              <th
                scope="col"
                class="py-2 px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium"
              >
                Covers
              </th>
              <th
                scope="col"
                class="py-2 pl-3 pr-1 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right"
              >
                Pays
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in payouts"
              :key="row.bet"
              class="border-b border-neutral-800/60 last:border-0"
            >
              <td class="py-2.5 pr-3 pl-1 text-neutral-200">
                {{ row.bet }}
              </td>
              <td class="py-2.5 px-3 text-neutral-400">
                {{ row.covers }}
              </td>
              <td class="py-2.5 pl-3 pr-1 text-right font-mono font-semibold text-amber-300">
                {{ row.pays }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-neutral-400">
        Notice the symmetry: a straight-up bet covers one number and pays 35:1; a dozen covers
        twelve and pays 2:1. Twelve times the coverage, roughly a twelfth of the payout. That is
        not a coincidence — it is the house quietly keeping the same cut no matter how you spread
        your chips. To see the exact expected value behind every line of this table, visit the
        <NuxtLink
          to="/analysis"
          class="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          Analysis page</NuxtLink>.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const payouts = [
  { bet: 'Straight (single number)', covers: '1 number', pays: '35:1' },
  { bet: 'Split', covers: '2 numbers', pays: '17:1' },
  { bet: 'Street', covers: '3 numbers', pays: '11:1' },
  { bet: 'Corner', covers: '4 numbers', pays: '8:1' },
  { bet: 'Six line', covers: '6 numbers', pays: '5:1' },
  { bet: 'Column / Dozen', covers: '12 numbers', pays: '2:1' },
  { bet: 'Even-money (red/black, odd/even, high/low)', covers: '18 numbers', pays: '1:1' }
]
</script>
