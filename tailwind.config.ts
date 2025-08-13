// tailwind.config.js
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue",
  ],
  // This is the important part
  safelist: [
    'object-contain',
    'object-cover', // It's good practice to safelist its opposite too
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}