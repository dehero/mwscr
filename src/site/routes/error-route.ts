import type { SiteRoute } from '../../core/entities/site-route.js';
import { ErrorPage } from '../pages/ErrorPage/ErrorPage.jsx';
import { texts } from '../texts/index.js';
import { homeRoute } from './home-route.js';

export const errorRoute: SiteRoute = {
  path: '*',
  info: () => ({ label: texts.app.error }),
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  createUrl: () => '/error/',
  component: ErrorPage,
};
