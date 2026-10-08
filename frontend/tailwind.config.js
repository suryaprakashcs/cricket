/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ROYAL KINGS theme — inspired by ref #002BD0 (royal blue) + #F9E04A (crown yellow)
        royal: {
          950: '#040b2e',
          900: '#0a185e',
          800: '#002bd0',
          700: '#2e4de6',
          600: '#5a74f0',
          100: '#d6deff',
          50: '#eef1ff',
        },
        crown: {
          400: '#f9e04a',
          500: '#d9be0a',
          600: '#a98f00',
        },
        parchment: '#fffef5',
        out: '#e11d48',
      },
      fontFamily: {
        display: ['Oswald', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'royal-stripes':
          'repeating-linear-gradient(90deg, #0a185e 0px, #0a185e 40px, #040b2e 40px, #040b2e 80px)',
        'arena-glow':
          'radial-gradient(ellipse at top, rgba(249,224,74,0.16), transparent 60%), radial-gradient(ellipse at bottom, rgba(0,43,208,0.45), transparent 70%)',
      },
    },
  },
  plugins: [],
}
