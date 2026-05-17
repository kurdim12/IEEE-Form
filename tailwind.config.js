/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ieee: {
          DEFAULT: '#00629B',
          50: '#E6F2F8',
          100: '#CCE5F1',
          200: '#99CBE3',
          300: '#66B1D5',
          400: '#3397C7',
          500: '#00629B',
          600: '#004F7C',
          700: '#003B5D',
          800: '#00283E',
          900: '#00141F',
        },
        petra: {
          DEFAULT: '#8B2331',
          50: '#FBEFF1',
          100: '#F4D6DB',
          200: '#E5AAB3',
          300: '#D27D8B',
          400: '#B14F60',
          500: '#8B2331',
          600: '#6F1B27',
          700: '#54141D',
          800: '#380D14',
          900: '#1C070A',
        },
        accent: {
          DEFAULT: '#FFB81C',
          light: '#FFCF5C',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'check-pop': 'checkPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(0, 98, 155, 0.15)',
        card: '0 8px 32px -8px rgba(0, 98, 155, 0.18)',
      },
    },
  },
  plugins: [],
};
