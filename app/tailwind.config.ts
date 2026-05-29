import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        portal: {
          bg: '#06080d',
          panel: '#0d121c',
          line: '#1d2838',
          pot: '#7dd3fc',
          good: '#34d399',
          warn: '#fbbf24',
          bad: '#fb7185'
        }
      }
    }
  },
  plugins: []
};
export default config;
