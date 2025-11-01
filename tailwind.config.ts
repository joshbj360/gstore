

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
 darkMode: 'class',
  
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C42B78",
          light: "#E55FA1",
          dark: "#9E205E",
        },
        // You can use semantic color names here
        background: {
          light: '#ffffff', // Your light mode background
          dark: '#0d0d0d',  // Your dark mode background
        },
        text: {
          light: '#171717', // Your light mode text (neutral-900)
          dark: '#e5e5e5',  // Your dark mode text (neutral-200)
        }
      }
    },
  },
  plugins: [],
}