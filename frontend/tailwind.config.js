/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        nova: {
          bg:        '#FFFFFF',
          fg:        '#0A0A0A',
          primary:   '#FDC700',
          secondary: '#F4F4F5',
          muted:     '#F5F5F5',
          border:    '#E5E5E5',
        },
      },
      borderRadius: {
        'nova': '18px',
      },
    },
  },
  plugins: [],
}