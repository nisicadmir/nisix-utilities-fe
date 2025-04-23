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
      type: 'default',
    },
    '/time-converter': {
      type: 'default',
    },
    '/time-converter-seo': {
      type: 'default',
    },
    '/uuid-generator': {
      type: 'default',
    },
    '/password-generator': {
      type: 'default',
    },
    '/snake-game': {
      type: 'default',
    },
    '/battleship-game': {
      type: 'default',
    },
    '/battleship-game-play': {
      type: 'default',
    },
  },
  puppeteerLaunchOptions: {
    args: [
      '--disable-gpu',
      '--renderer',
      '--no-sandbox',
      '--no-service-autorun',
      '--no-experiments',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
    ],
  },
};
