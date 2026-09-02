import { lazy } from 'solid-js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { HomePageData } from '../pages/HomePage/HomePage.data.js';
import { queryHomePageData } from '../pages/HomePage/HomePage.data.js';
import { texts } from '../texts/index.js';

export const homeRoute: SiteRoute<SiteRouteParams, HomePageData> = {
  path: '/',
  info: () => ({
    label: texts.app.home,
  }),
  createUrl: () => '/',
  component: lazy(() => import('../pages/HomePage/HomePage.jsx')),
  preload: () => queryHomePageData(),
};
