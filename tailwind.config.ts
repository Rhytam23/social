import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware: these flip in light mode (see app/globals.css).
        slate: {
          50: v('slate-50'),
          100: v('slate-100'),
          200: v('slate-200'),
          300: v('slate-300'),
          400: v('slate-400'),
          500: v('slate-500'),
          600: v('slate-600'),
          700: v('slate-700'),
          800: v('slate-800'),
          900: v('slate-900'),
          950: v('slate-950'),
        },
        emerald: {
          ...colors.emerald,
          300: v('emerald-300'),
          400: v('emerald-400'),
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '2xl': '1rem',
        xl: '0.75rem',
        lg: '0.5rem',
        md: '0.375rem',
      },
      spacing: {
        13: '3.25rem',
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
