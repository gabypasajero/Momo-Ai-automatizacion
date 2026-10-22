/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      // Paleta DTO definida como variables CSS (src/index.css) para permitir marca blanca por empresa.
      colors: {
        brand: {
          50: v('brand-50'), 100: v('brand-100'), 200: v('brand-200'), 300: v('brand-300'), 400: v('brand-400'),
          500: v('brand-500'), 600: v('brand-600'), 700: v('brand-700'), 800: v('brand-800'), 900: v('brand-900'),
        },
        accent: v('accent'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        surface: v('surface'),
        success: { DEFAULT: v('success'), soft: v('success-soft'), chart: v('success-chart') },
        danger: { DEFAULT: v('danger'), soft: v('danger-soft') },
        warning: { DEFAULT: v('warning'), soft: v('warning-soft'), chart: v('warning-chart') },
      },
      boxShadow: { card: '0 8px 28px rgba(31, 43, 73, 0.06)' },
    },
  },
  plugins: [],
}
