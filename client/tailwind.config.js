/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A6B47',
          50: '#E8F5EE',
          100: '#C5E5D3',
          200: '#9BCFB4',
          300: '#71B994',
          400: '#47A374',
          500: '#1A6B47',
          600: '#155A3A',
          700: '#10492E',
          800: '#0B3722',
          900: '#062616',
        },
        sidebar: '#FAFAFA',
        card: '#FFFFFF',
        muted: '#6B7280',
        border: '#E5E7EB',
        dark: {
          bg: '#111111',
          card: '#1C1C1C',
          border: '#2D2D2D',
          sidebar: '#161616',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        input: '4px',
      },
      spacing: {
        base: '16px',
        card: '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
