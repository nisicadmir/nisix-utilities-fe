import { ScullyConfig } from '@scullyio/scully';
import '@scullyio/scully-plugin-puppeteer';

export const config: ScullyConfig = {
  projectRoot: './src',
  projectName: 'nisix-utilities',
  distFolder: './dist/nisix-utilities/browser', // output directory of your Angular build artifacts
  outDir: './dist/nisix-utilities/static', // directory for scully build artifacts
  defaultPostRenderers: [],
  routes: {
    '/': {
      type: 'json',
    },
    '/time-converter': {
      type: 'json',
    },
    '/uuid-generator': {
      type: 'json',
    },
    '/password-generator': {
      type: 'json',
    },
    'snake-game': {
      type: 'json',
    },
    '/snake-game': {
      type: 'json',
    },
  },
};
