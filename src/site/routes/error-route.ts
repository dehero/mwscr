import type { SiteRoute } from '../../core/entities/site-route.ts';
import { ErrorPage } from '../pages/ErrorPage/ErrorPage.tsx';
import { texts } from '../texts/index.ts';
import { homeRoute } from './home-route.ts';

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
