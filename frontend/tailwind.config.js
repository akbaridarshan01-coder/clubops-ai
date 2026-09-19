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
        background: {
          DEFAULT: '#F4F5FB',
          canvas: '#ECEEF8',
          card: '#FFFFFF',
          hover: '#F8F9FE',
          active: '#F0F2FB',
          subtle: '#F8FAFC'
        },
        border: {
          DEFAULT: '#E8ECF4',
          subtle: '#F1F3F9',
          highlight: '#D5DAE8'
        },
        text: {
          main: '#191E35',
          muted: '#7A829D',
          light: '#A0A6BD'
        },
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          DEFAULT: '#4F46E5'
        },
        accent: {
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        subtle: '0 2px 10px rgba(25, 30, 53, 0.03)',
        card: '0 4px 20px -2px rgba(25, 30, 53, 0.05)',
        hover: '0 8px 30px -4px rgba(25, 30, 53, 0.08)',
        glow: '0 4px 20px rgba(79, 70, 229, 0.25)',
        'glow-cyan': '0 4px 20px rgba(6, 182, 212, 0.25)',
        'glow-rose': '0 4px 20px rgba(244, 63, 94, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}
