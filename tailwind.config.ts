import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#171714',
        ivory: '#f7f6f1',
        sand: '#e8e3d8',
        brass: '#9a7b3f',
      },
      boxShadow: {
        soft: '0 20px 60px -30px rgb(23 23 20 / 0.28)',
      },
    },
  },
  plugins: [],
} satisfies Config
