import type { Config } from 'vike/types';
import { HelpPage } from '../../components/HelpPage/HelpPage.jsx';
import { helpRoute } from '../../routes/help-route.js';

const config: Config = {
  route: helpRoute.path,
  Page: HelpPage,
};

export default config;
