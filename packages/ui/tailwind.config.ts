import type { Config } from 'tailwindcss';
import sharedConfig from '@repo/tailwind-config';

// const config: Pick<Config, "prefix" | "presets" | "content"> = {
const config: Partial<Config> = {
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {
      backgroundImage: {
        'white-radial-gradient':
          'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      colors: {
        'base-color': '#FFB685',
      },
    },
  },
  presets: [sharedConfig],
};

export default config;
