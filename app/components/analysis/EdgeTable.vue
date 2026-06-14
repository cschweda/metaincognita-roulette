<template>
  <section
    aria-labelledby="edge-table-heading"
    class="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4"
  >
    <h2
      id="edge-table-heading"
      class="text-sm font-semibold text-neutral-200"
    >
      House edge by rule
    </h2>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-neutral-800 text-left">
            <th class="py-2 pr-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
              Rule
            </th>
            <th class="py-2 px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right">
              Pockets
            </th>
            <th class="py-2 pl-3 text-[10px] uppercase tracking-widest text-neutral-400 font-medium text-right">
              House edge
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b border-neutral-800/60 last:border-0"
          >
            <td class="py-2.5 pr-3 text-neutral-200">
              {{ row.label }}
            </td>
            <td class="py-2.5 px-3 text-right font-mono text-neutral-300">
              {{ row.pockets }}
            </td>
            <td class="py-2.5 pl-3 text-right font-mono font-semibold text-rose-300">
              {{ row.edge.toFixed(2) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-[11px] text-neutral-400 leading-snug">
      The takeaway: that single green zero — or the double green on the American wheel — <span class="text-neutral-200">is</span> the edge.
      Remove it and the game would be break-even. Every rule above is just a different way of pricing those green pockets.
    </p>
  </section>
</template>

<script setup lang="ts">
import { rouletteConfig } from '~~/roulette.config'
import { pocketCount } from '~/engine/wheel'

const rows = rouletteConfig.presets.map(preset => ({
  id: preset.id,
  label: preset.label,
  pockets: pocketCount(preset.variant),
  edge: preset.edgePct
}))
</script>
