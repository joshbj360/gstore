// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
  ],
  ssr: true,
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
    "@nuxtjs/cloudinary",
    'nuxt-charts',
    '@nuxtjs/color-mode',
    'nuxt3-notifications',
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
      siteName: process.env.NUXT_PUBLIC_SITE_NAME,
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      paystackPk: process.env.PAYSTACK_PUBLIC_KEY,
      CloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET
    },
    private: {
      cloudinary: {
        apiSecret: process.env.CLOUDINARY_API_SECRET
      }

    }
  }
})
