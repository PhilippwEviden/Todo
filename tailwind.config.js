module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6fffb',
          100: '#ecfff6',
          200: '#d1fbe6',
          300: '#a8f4cc',
          400: '#74eaa9',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#0f5132',
          900: '#064e2b'
        },
        amberAccent: '#f6ad55'
      },
      boxShadow: {
        card: '0 6px 18px rgba(2,6,23,0.08)'
      }
    }
  },
  plugins: []
};
