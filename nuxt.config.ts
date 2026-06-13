export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxt/ui', '@nuxt/test-utils'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  colorMode: { preference: 'dark', fallback: 'dark' },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Roulette Trainer',
      meta: [
        { name: 'description', content: 'A visual, accurate roulette trainer with a real forward-physics wheel — proven fair by simulation.' },
        { property: 'og:title', content: 'Roulette Trainer' },
        { property: 'og:description', content: 'A real forward-physics wheel, proven fair. Learn why you can\'t beat the wheel.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/og-image.svg' }],
    },
  },
  compatibilityDate: '2025-01-15',
  eslint: { config: { stylistic: { commaDangle: 'never', braceStyle: '1tbs' } } },
})
