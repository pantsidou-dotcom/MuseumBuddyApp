import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          surface: '#eff6ff',
          ink: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 45px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
