/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ff',
          100: '#fce8ff',
          200: '#f9d0fe',
          300: '#f5a8fc',
          400: '#ee70f8',
          500: '#e03cee',
          600: '#c41dd0',
          700: '#a316aa',
          800: '#86158a',
          900: '#6d166f',
        },
        night: {
          900: '#0a0118',
          800: '#1a0f2e',
          700: '#2a1f3e',
        }
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
