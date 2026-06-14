<template>
  <section
    aria-labelledby="learn-strategy-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-6 space-y-5"
  >
    <h2
      id="learn-strategy-heading"
      class="text-base font-semibold text-neutral-100"
    >
      Why the house always wins (and how to lose slower)
    </h2>

    <div class="space-y-4 text-sm leading-relaxed text-neutral-300">
      <p>
        Here is the honest part. Roulette is not rigged, the wheel is not crooked, and the croupier
        is not against you. The game is fair in the only sense that matters — every pocket is
        equally likely — and you will still lose if you play long enough. The reason is small,
        green, and built into the rules.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        The green zero is the edge
      </h3>
      <p>
        Imagine betting on red. There are 18 red pockets and 18 black ones, and if those were the
        only pockets, an even-money bet would be a true coin flip — pay 1:1 on an even chance and
        nobody has an advantage. But the wheel also has the green
        <span class="font-mono text-emerald-300">0</span> (and on the American wheel, the
        <span class="font-mono text-emerald-300">00</span>). Red still pays as if those green
        pockets did not exist. That gap is the whole game. On a single-zero wheel it is one pocket
        in thirty-seven — a <span class="text-neutral-100">2.70%</span> house edge. On a
        double-zero wheel it is two in thirty-eight — <span class="text-neutral-100">5.26%</span>.
        And it applies to nearly every bet equally: spread your chips however you like, the house
        keeps the same slice. See the exact figures on the
        <NuxtLink
          to="/analysis"
          class="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          Analysis page</NuxtLink>.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        No betting system beats it
      </h3>
      <p>
        Martingale, D'Alembert, Fibonacci, Paroli — every "system" you have heard of does the same
        thing: it rearranges <span class="text-neutral-100">when</span> you win and lose. None of
        them touches the long-run average, because they cannot. Each spin carries the same edge, and
        a string of spins just adds those edges up. Doubling your bet after every loss
        (Martingale) feels unbeatable because you usually claw back a small win — but you are
        trading many small wins for a rare, catastrophic one. A finite bankroll and a table maximum
        guarantee you eventually hit a losing run you cannot double through, and that single run
        erases everything. You do not have to take this on faith: run a system across thousands of
        sessions in the
        <NuxtLink
          to="/analysis"
          class="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          simulator</NuxtLink>
        and watch the average refuse to budge.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        The gambler's fallacy
      </h3>
      <p>
        The wheel has no memory. After ten reds in a row, red and black are still very nearly
        equally likely on the next spin — the ball does not know what it did before, and it does not
        owe black a turn. The feeling that a colour is "due" is one of the most expensive instincts
        in the casino, and it is exactly backwards. Past spins tell you nothing about the next one,
        because every spin is an independent event with the same odds it always had.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        Why it still feels worth it
      </h3>
      <p>
        If the math is this clear, why does anyone play? Because our brains are not built for it.
        Behavioural economists studying <span class="text-neutral-100">prospect theory</span> found
        two quirks that roulette exploits perfectly. First, we feel losses about
        <span class="text-neutral-100">twice as hard</span> as we feel equivalent gains — losing
        $50 stings more than winning $50 pleases. Second, we
        <span class="text-neutral-100">overweight tiny probabilities</span> of a big payoff — a
        one-in-thirty-seven shot at 35:1 feels far more likely, and far more thrilling, than it
        really is. Put those together and you get a machine tuned to your psychology: the
        long-shot straight-up bet is a jolt of hope, while a near-certain slow bleed barely
        registers as a cost. Knowing this is the only real edge a disciplined player has — not over
        the wheel, but over their own brain.
      </p>

      <h3 class="text-sm font-semibold text-neutral-200 pt-1">
        What actually lowers your risk
      </h3>
      <p>
        You cannot beat the edge, but you can shrink how fast it bleeds you, and that is worth
        knowing:
      </p>
      <ul class="space-y-2 pl-1">
        <li class="flex gap-2.5">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <span>
            <span class="text-neutral-100">Play the lowest-edge table you can find.</span>
            Always prefer a single-zero (European) wheel over a double-zero one — that one choice
            cuts your cost nearly in half. Better still are tables with
            <span class="text-neutral-100">La Partage</span> or
            <span class="text-neutral-100">Surrender</span> rules, which return half your
            even-money bet when the ball hits zero and drop the even-money edge to roughly
            <span class="text-neutral-100">1.35%</span> (single-zero) or
            <span class="text-neutral-100">2.63%</span> (double-zero).
          </span>
        </li>
        <li class="flex gap-2.5">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <span>
            <span class="text-neutral-100">Flat bet.</span> Wager the same small amount every
            spin. It will not change your expected loss, but it keeps a bad streak from
            snowballing the way progressive systems do.
          </span>
        </li>
        <li class="flex gap-2.5">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <span>
            <span class="text-neutral-100">Set a loss limit before you sit down</span> — a number
            you decide in advance and walk away at, no negotiation in the moment.
          </span>
        </li>
        <li class="flex gap-2.5">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <span>
            <span class="text-neutral-100">Treat the expected loss as the price of an evening's
              entertainment</span>, not an investment you expect to grow. That framing is the
            difference between a fun night and a chase.
          </span>
        </li>
      </ul>
      <p class="text-neutral-400">
        The smart move, almost always, is to bet small or not at all — and to know precisely what
        each spin costs you. That is the entire point of being honest about the math.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
// Content-only section. No reactive state.
</script>
