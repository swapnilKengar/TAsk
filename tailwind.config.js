/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3F5F8',
        surface: '#FFFFFF',
        ink: '#0B1F2A',
        navy: '#0B1F2A',
        muted: '#5E6E7C',
        line: '#E1E6EC',
        brand: '#0F8B8D',
        crit: '#C62828',
        high: '#D96B0B',
        med: '#A67C00',
        low: '#2E8B57',
      },
      fontFamily: { sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};