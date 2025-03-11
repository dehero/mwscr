import type { Config } from 'vike/types';
import vikeSolidConfig from 'vike-solid/config';
import { HomePage } from '../components/HomePage/HomePage.js';
import { Page } from '../components/Page/Page.js';

const config: Config = {
  Page: HomePage,
  Layout: Page,
  passToClient: ['is404', 'pageProps', 'errorWhileRendering'],
  extends: [vikeSolidConfig],
};

export default config;
