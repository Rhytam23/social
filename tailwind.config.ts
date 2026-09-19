import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const ramp = (prefix: string) =>
  Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, v(`${prefix}-${n}`)]));

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Both scales are theme-aware and defined in app/globals.css.
        // slate = the neutral ramp. emerald = the ACCENT ramp (a cool blue-cyan);
        // the name is historical, kept so existing classes keep working.
        slate: ramp('slate'),
        emerald: ramp('accent'),
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      // Tighter than Tailwind's defaults: calm, not bubbly.
      borderRadius: {
        '3xl': '1.125rem',
        '2xl': '0.875rem',
        xl: '0.625rem',
        lg: '0.5rem',
        md: '0.375rem',
      },
      boxShadow: {
        xs: 'var(--shadow-1)',
        sm: 'var(--shadow-1)',
        DEFAULT: 'var(--shadow-2)',
        md: 'var(--shadow-2)',
        lg: 'var(--shadow-2)',
        xl: 'var(--shadow-pop)',
        '2xl': 'var(--shadow-pop)',
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
