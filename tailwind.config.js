/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 主視覺調色板：珊瑚粉系 */
        primary: {
          50:  '#fff3f5',
          100: '#ffe4e9',
          200: '#ffc9d3',
          300: '#ffa3b3',
          400: '#f27e93',  /* 主珊瑚粉 #F27E93 */
          500: '#e8607e',
          600: '#d04060',
          700: '#b02848',
          800: '#8c1832',
          900: '#6c1026',
        },
        /* 主視覺調色板：夜空藍 */
        night: {
          900: '#0c0f1e',
          800: '#121826',
          700: '#1a2235',
          600: '#222d44',
        },
        /* 主視覺輔色 */
        brand: {
          coral:  '#F27E93',
          blue:   '#5B7BA8',
          amber:  '#F2BE5C',
          peach:  '#F2A488',
          blush:  '#F2D9D0',
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
