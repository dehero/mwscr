import type { SiteRoute } from '../../core/entities/site-route.js';
import { ErrorPage } from '../pages/ErrorPage/ErrorPage.jsx';
import { homeRoute } from './home-route.js';

export const errorRoute: SiteRoute = {
  path: '*',
  info: () => ({}),
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  createUrl: () => '/error/',
  component: ErrorPage,
};
