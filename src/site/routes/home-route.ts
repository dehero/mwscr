import { lazy } from 'solid-js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { HomePageData } from '../pages/HomePage/HomePage.data.js';
import { queryHomePageData } from '../pages/HomePage/HomePage.data.js';

export const homeRoute: SiteRoute<SiteRouteParams, HomePageData> = {
  path: '/',
  info: () => ({
    label: 'Home',
  }),
  createUrl: () => '/',
  component: lazy(() => import('../pages/HomePage/HomePage.jsx')),
  preload: () => queryHomePageData(),
};
