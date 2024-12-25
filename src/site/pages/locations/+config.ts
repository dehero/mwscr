import type { Config } from 'vike/types';
import { LocationsPage } from '../../components/LocationsPage/LocationsPage.jsx';
import { locationsRoute } from '../../routes/locations-route.js';

const config: Config = {
  route: locationsRoute.path,
  Page: LocationsPage,
};

export default config;
