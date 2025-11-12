import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Steno-Inspired Palette
        primary: {
          DEFAULT: '#1E2A78',  // Deep Royal Blue
          dark: '#2A2F65',     // Darker Blue
          light: '#4F5B93',    // Muted Blue
          50: '#F6F7FC',       // Very light blue
        },
        secondary: {
          DEFAULT: '#F4F1E9',  // Creamy Beige
          dark: '#E5E1D8',     // Darker Beige
          50: '#FDFCF9',       // Very light beige
        },
        accent: {
          DEFAULT: '#C59E47',  // Warm Gold
          dark: '#A88339',     // Dark Gold
          light: '#D4B36A',    // Light Gold
          50: '#FAF8F3',       // Very light gold
        },
        text: {
          DEFAULT: '#2A2A2A',  // Charcoal
          light: '#6B6B6B',    // Medium Gray
          lighter: '#9B9B9B',  // Light Gray
        },
        // Status Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['56px', { lineHeight: '1.1' }],
        'display-md': ['40px', { lineHeight: '1.2' }],
        'display-sm': ['32px', { lineHeight: '1.3' }],
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6' }],
        'body-md': ['14px', { lineHeight: '1.5' }],
        'body-sm': ['12px', { lineHeight: '1.5' }],
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config

