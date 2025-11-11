import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E2A78', // Deep Royal Blue
        secondary: '#F4F1E9', // Creamy Beige
        accent: '#C59E47', // Warm Gold
        dark: '#2A2A2A', // Charcoal
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['56px', { lineHeight: '1.1' }],
        'display-md': ['40px', { lineHeight: '1.2' }],
        'display-sm': ['32px', { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
} satisfies Config

