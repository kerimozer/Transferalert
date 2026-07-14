/** @type {import('tailwindcss').Config} */
// TransferAlert tasarım token'ları — tek kaynak (bkz. .claude/skills/tasarimci)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E4EFF1',
          600: '#116173',
          700: '#0C4A59',
        },
        accent: {
          50: '#F7EBE1', 600: '#C2703D', 800: '#8F4E24',
        },
        surface: {
          DEFAULT: '#FFFFFF', bg: '#F7F5F2', alt: '#F0EDE8',
          border: '#E7E3DD', borderstrong: '#D6D1C8',
        },
        ink: { DEFAULT: '#292524', soft: '#57534E', muted: '#A8A29E' },
        ok:   { 50: '#E3F0EA', 600: '#2E7D5B', 800: '#1F5C42' },
        warn: { 50: '#FBEFDC', 600: '#B45309', 800: '#8A3E06' },
        bad:  { 50: '#F9E7E4', 600: '#B3402F', 800: '#8C3123' },
      },
      fontFamily: { sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '16px', control: '12px' },
      boxShadow: { card: '0 1px 3px rgba(120,113,108,.08), 0 4px 12px rgba(120,113,108,.06)' },
    },
  },
  plugins: [],
};
