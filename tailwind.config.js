/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cura: {
          50: '#F0F9FF',
          100: '#E4F4FB', // Soft background light blue
          200: '#B9E6FE',
          300: '#7CD4FD',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0B2136', // Deep navy for primary buttons
        }
      },
      fontFamily: {
        heading: ['Outfit'],
        body: ['Inter'],
      }
    },
  },
  plugins: [],
}
