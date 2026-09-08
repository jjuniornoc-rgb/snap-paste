/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#09090b',
          900: '#0f0f12',
          850: '#141418',
          800: '#1a1a20',
          750: '#202028',
          700: '#282832',
        },
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        amber: {
          accent: '#f59e0b',
          glow: '#fbbf24',
          deep: '#d97706',
          muted: '#92400e',
        },
        copper: {
          light: '#f97316',
          DEFAULT: '#ea580c',
          dark: '#c2410c'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'glow-amber-lg': '0 0 45px -5px rgba(245, 158, 11, 0.35)',
        'subtle-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
