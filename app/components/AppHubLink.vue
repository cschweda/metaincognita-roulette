<!-- The suite's exit door: back to the floor at metaincognita.com, where every
     Metaincognita game lives. Nine games hung off that hub and not one of them
     linked home — a player deep in a trainer had no way out but the back button.

     Chrome is identical in every app (guidelines §5), so this stays gold even
     though the trainer's accent is rose. It is suite chrome, not game chrome:
     a player learns it once and finds it in the same corner everywhere.

     Three things here are load-bearing, not stylistic:
       - No `target` — this is an exit, not a side trip. A new tab would leave
         the trainer running behind it.
       - It never hides and it never confirms. It is not the "Back" button: it
         destroys nothing (the session autosaves on every mutation), and the
         whole point is that you can always get out.
       - The aria-label must CONTAIN the visible wordmark verbatim, or it fails
         WCAG 2.5.3 Label in Name — "Meta Incognita" would break on the space. -->
<template>
  <a
    href="https://metaincognita.com"
    aria-label="METAINCOGNITA — exit the simulator, back to all the games"
    class="flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 text-amber-400 transition-colors hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
  >
    <UIcon
      name="i-lucide-log-out"
      class="w-3.5 h-3.5"
      aria-hidden="true"
    />
    <span class="text-[10px] font-semibold tracking-[0.12em]">METAINCOGNITA</span>
  </a>
</template>
