/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bistro: {
          cream: '#FAF7F2',
          brown: '#3C2A1E',
          gold: '#C9A84C',
          sage: '#7A9E7E',
          red: '#C0392B',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
