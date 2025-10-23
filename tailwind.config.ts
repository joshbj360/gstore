

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
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C42B78", // replace with your brand hex
          light: "#E55FA1",
          dark: "#9E205E",
        },
        Background: {
          light: '#f9f9f9',
          dark: '#0d0d0d',
        }
      }
    },
  },
  plugins: [],
}