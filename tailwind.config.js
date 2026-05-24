/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#03070e',
          900: '#060d1a',
          800: '#0a1628',
          700: '#0f1e38',
          600: '#162843',
          500: '#1e3557',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -4px rgb(6 182 212 / 0.25)',
        'glow-coral': '0 0 20px -4px rgb(244 63 94 / 0.25)',
        'glow-mint': '0 0 20px -4px rgb(52 211 153 / 0.25)',
        'card': '0 4px 24px -4px rgb(0 0 0 / 0.4), 0 2px 8px -2px rgb(0 0 0 / 0.3)',
        'card-lg': '0 8px 32px -4px rgb(0 0 0 / 0.5), 0 4px 16px -4px rgb(0 0 0 / 0.3)',
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #060d1a, #0a1628 50%, #060d1a)',
        'gradient-hero': 'linear-gradient(135deg, #0a1628 0%, #0f1e38 50%, #060d1a 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
