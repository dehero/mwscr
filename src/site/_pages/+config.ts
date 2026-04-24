import type { Config } from 'vike/types';
import vikeSolidConfig from 'vike-solid/config';
import { HomePage } from '../pages/HomePage/HomePage.jsx';
import { App } from '../components/App/App.jsx';

const config: Config = {
  Page: HomePage,
  Layout: App,
  passToClient: ['is404', 'pageProps', 'errorWhileRendering'],
  extends: [vikeSolidConfig],
};

export default config;
