import { lazy } from 'solid-js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.ts';
import type { LocationsPageData } from '../pages/LocationsPage/LocationsPage.data.ts';
import { queryLocationsPageData } from '../pages/LocationsPage/LocationsPage.data.ts';
import { texts } from '../texts/index.ts';
import { homeRoute } from './home-route.ts';

export const locationsRoute: SiteRoute<SiteRouteParams, LocationsPageData> = {
  path: '/locations',
  info: () => ({
    label: texts.location.locations,
  }),
  createUrl: () => '/locations/',
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  component: lazy(() => import('../pages/LocationsPage/LocationsPage.tsx')),
  preload: () => queryLocationsPageData(),
};
