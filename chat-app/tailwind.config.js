/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

  ],
  theme: {
    extend: {
      colors: {
        'track-blue': '#6e07f3',
        'track-green': '#5BE9B9',
        'track-purple': '#aa53f2',
        'error-red': '#9f0707',
      }
    },
  },
  plugins: [],
}