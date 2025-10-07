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
  runtimeConfig: {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    platformCommissionRate: process.env.PLATFORM_COMMISSION_RATE,
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      paystackPk: process.env.PAYSTACK_PUBLIC_KEY

    }
  }
})
