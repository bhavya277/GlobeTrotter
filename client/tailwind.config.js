/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070c18',
          900: '#0b132b',
          850: '#111b38',
          800: '#1c2541',
          700: '#2a365c',
        },
        coral: {
          500: '#ff5a5f',
          600: '#ea580c',
          700: '#c2410c',
        },
        turquoise: {
          400: '#2dd4bf',
          500: '#14b8a6',
        },
        brand: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
