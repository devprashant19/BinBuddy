import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        wash: 'var(--color-wash)',
        surface: 'var(--color-surface)',
        line: 'var(--color-line)',
        muted: 'var(--color-muted)',
        'bin-recycle': 'var(--bin-recycle)',
        'bin-landfill': 'var(--bin-landfill)',
        'bin-special': 'var(--bin-special)',
        'bin-yard': 'var(--bin-yard)',
        'bin-manual': 'var(--bin-manual)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
