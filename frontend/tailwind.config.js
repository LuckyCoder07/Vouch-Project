/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We will use the 'class' strategy for manual toggle
  theme: {
    extend: {
      colors: {
        vouch: {
          light: '#f1f5f9', // Slate 100 - Slightly more grey for better contrast
          dark: '#0f172a',  // Slate 900 - Deeper dark mode
          accent: '#2563eb', // Blue 600
          accentHover: '#1d4ed8', // Blue 700
        }
      }
    },
  },
  plugins: [],
}
