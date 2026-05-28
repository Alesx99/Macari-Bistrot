/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bistrot: {
          50:  '#FAF6EF',
          100: '#F2E9D7',
          200: '#E3D2AC',
          300: '#CFB47C',
          400: '#B8954D',
          500: '#A07A35',
          600: '#8B6F3E',
          700: '#6B5530',
          800: '#4A3A20',
          900: '#2D2313'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Montserrat', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
