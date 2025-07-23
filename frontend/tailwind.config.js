/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5E2121',
        secondary: '#B69D7E', 
        accent: '#F2CE9F',
        background: '#F1EBDF',
        purple: '#8B5CF6'
      },
      fontFamily: {
        'mart': ['Mart', 'sans-serif'],
      }
    },
  },
  plugins: [],
}