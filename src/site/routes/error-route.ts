import type { SiteRoute } from '../../core/entities/site-route.js';
import { ErrorPage } from '../pages/ErrorPage/ErrorPage.jsx';

export const errorRoute: SiteRoute = {
  path: '*',
  info: () => ({
    title: 'Error',
  }),
  createUrl: () => '/error/',
  getData: async () => undefined,
  component: ErrorPage,
};
