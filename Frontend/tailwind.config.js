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
        // Zorvi brand color palette & warm coral spectrum
        brand: {
          50: '#fff5f2',
          100: '#fdeee9',
          200: '#f8d5c9',
          300: '#f4b29f',
          400: '#ff7a59',
          500: '#f0512f', // Core Zorvi Brand
          600: '#d63f1e',
          700: '#bd3a1e',
          800: '#992d16',
          900: '#7a2412',
          950: '#431006',
        },
        nebula: {
          50: '#fff5f2',
          100: '#fdeee9',
          200: '#f8d5c9',
          300: '#f4b29f',
          400: '#ff7a59',
          500: '#f0512f',
          600: '#d63f1e',
          700: '#bd3a1e',
          800: '#992d16',
          900: '#7a2412',
          950: '#431006',
        },
        // Warm dark charcoal / obsidian tones (Zorvi canvas & surfaces)
        slate: {
          750: '#232a3b',
          800: '#181d28',
          850: '#12161f',
          900: '#0f131c',
          950: '#0b0f17',
        },
        // Zorvi semantic accents
        accent: {
          brand: '#f0512f',
          ok: '#0e9f6e',
          warn: '#f59e0b',
          stop: '#ef4444',
          amber: '#f59e0b',
          emerald: '#0e9f6e',
          rose: '#ef4444',
          sky: '#38bdf8',
          indigo: '#f0512f', // Remap default indigo utilities to Zorvi brand where applicable
          violet: '#f97316',
          cyan: '#2dd4bf',
        },
        // Zorvi specific tokens
        zv: {
          canvas: '#0b0f17',
          surface: '#12161f',
          card: '#181d28',
          inset: '#0e121b',
          line: 'rgba(255, 255, 255, 0.08)',
          'line-warm': 'rgba(224, 213, 201, 0.12)',
          ink: '#ffffff',
          'ink-muted': '#94a3b8',
          'ink-subtle': '#64748b',
          brand: '#f0512f',
          'brand-soft': '#fdeee9',
          'brand-hover': '#d63f1e',
          ok: '#0e9f6e',
          warn: '#b45309',
          stop: '#a81f16',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-sm': '0 0 20px -5px rgba(240, 81, 47, 0.20)',
        'glow-md': '0 0 35px -5px rgba(240, 81, 47, 0.30)',
        'glow-lg': '0 0 50px -10px rgba(240, 81, 47, 0.40)',
        'glow-orange': '0 0 35px -5px rgba(240, 81, 47, 0.35)',
        'glow-cyan': '0 0 35px -5px rgba(45, 212, 191, 0.25)',
        'card-border': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        'zv-sm': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'zv-md': '0 2px 8px rgba(0, 0, 0, 0.35), 0 8px 24px -12px rgba(240, 81, 47, 0.20)',
        'zv-lg': '0 4px 12px rgba(0, 0, 0, 0.4), 0 24px 56px -20px rgba(240, 81, 47, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'zorvi-glow': 'zorviGlow 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        zorviGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(240, 81, 47, 0.45)' },
          '70%': { boxShadow: '0 0 0 12px rgba(240, 81, 47, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240, 81, 47, 0)' },
        }
      }
    },
  },
  plugins: [],
}
