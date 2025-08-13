// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
  ],
  modules: [
    '@nuxt/icon',
    'nuxt-lodash',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/supabase',
    ['@nuxtjs/tailwindcss', {
      config: {
        safelist: [
          'object-contain',
          'object-cover',
          'filter',
          'blur-lg',
          'scale-110'
        ]
      }
    }],
    '@vueuse/nuxt',
    'nuxt-tiptap-editor',
    'vue3-carousel-nuxt',
  ],
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/'],
    }
  },
})
