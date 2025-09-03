const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a202c',
          light: '#2d3748',
        },
      },
      fontFamily: {
        sans: ['var(--font-quicksand)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
