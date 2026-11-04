/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crema: '#FDF8F1',
        beige: '#F9F0E4',
        marfil: '#FFFDF8',
        arena: '#F0E4D6',
        rosa: { suave: '#FDE8E0', pastel: '#FBDDD8' },
        terracota: { DEFAULT: '#C4604D', claro: '#DB8562', oscuro: '#A84E3D' },
        chocolate: { DEFAULT: '#3B2418', medio: '#6B5145', suave: '#8A7265' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Karla', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '1.75rem' },
      boxShadow: {
        card: '0 10px 30px -12px rgba(59,36,24,0.18)',
        btn: '0 10px 24px -10px rgba(196,96,77,0.65)',
      },
      maxWidth: { site: '70rem' },
    },
  },
  plugins: [],
}
