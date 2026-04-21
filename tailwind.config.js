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
        // Atelier domain palette — pastel accents over navy
        'd1-peach':     '#fcd5b4',
        'd2-mint':      '#b8f2d8',
        'd3-ice':       '#cde9f5',
        'd4-lavender':  '#d8d5fc',
        'accent-rose':  '#fbcfe8',
        'accent-cream': '#fff3de',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
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
        'gradient-atelier':     'linear-gradient(135deg, #fde4c1 0%, #fbcfe8 50%, #d8d5fc 100%)',
        'gradient-atelier-warm':'linear-gradient(135deg, #fde4c1, #fbcfe8)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'orb-pulse': {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.96' },
          '50%':      { transform: 'scale(1.03)', opacity: '1' },
        },
        'halo-breathe': {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        'node-ring': {
          '0%':   { transform: 'scale(1)',   opacity: '0.35' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'starfield-drift': {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-30px)' },
        },
      },
      animation: {
        'orb-pulse':       'orb-pulse 3.5s ease-in-out infinite',
        'halo-breathe':    'halo-breathe 6s ease-in-out infinite',
        'node-ring':       'node-ring 2.8s ease-in-out infinite',
        'starfield-drift': 'starfield-drift 26s linear infinite',
      },
    },
  },
  plugins: [],
}
