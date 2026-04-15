/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED', 50: '#F5F0FF', 100: '#EDE8FF', 200: '#D8CCFF',
          300: '#BEA8FF', 400: '#9D75FF', 500: '#7C3AED', 600: '#6B21D6',
          700: '#5A16BF', 800: '#440E99', 900: '#2E0873',
        },
        creator: {
          DEFAULT: '#EC4899', 50: '#FFF0F7', 100: '#FFE0EF', 200: '#FFBBD9',
          300: '#FF8EC0', 400: '#F75FA9', 500: '#EC4899', 600: '#D4277E',
          700: '#B01865', 800: '#8C0F4E', 900: '#680A3B',
        },
        brand: {
          DEFAULT: '#0D9488', 50: '#F0FDFB', 100: '#CCFBF5', 200: '#99F5EC',
          300: '#5EE8DC', 400: '#2DD4C4', 500: '#0D9488', 600: '#0A7A70',
          700: '#086058', 800: '#064640', 900: '#04302B',
        },
        wallet: {
          DEFAULT: '#F59E0B', 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A',
          300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706',
          700: '#B45309', 800: '#92400E', 900: '#78350F',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-creator': 'linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)',
        'gradient-brand': 'linear-gradient(135deg, #0D9488 0%, #0EA5E9 100%)',
        'gradient-hero': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%)',
        'gradient-instagram': 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.12)',
        'card': '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.12)',
        'glow-primary': '0 0 30px rgba(124,58,237,0.25)',
        'glow-creator': '0 0 30px rgba(236,72,153,0.25)',
        'glow-brand': '0 0 30px rgba(13,148,136,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'wiggle': 'wiggle 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        wiggle: {
          '0%':   { transform: 'rotate(0deg)' },
          '15%':  { transform: 'rotate(14deg)' },
          '30%':  { transform: 'rotate(-10deg)' },
          '45%':  { transform: 'rotate(8deg)' },
          '60%':  { transform: 'rotate(-6deg)' },
          '75%':  { transform: 'rotate(4deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
