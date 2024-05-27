import type { Config } from 'vike/types';
import { config as vikeSolidConfig } from 'vike-solid/config';
import { AboutPage } from '../components/AboutPage/AboutPage.js';
import { Page } from '../components/Page/Page.js';

const config: Config = {
  Page: AboutPage,
  Layout: Page,

  passToClient: ['routeInfo'],
  extends: [vikeSolidConfig],
};

export default config;
