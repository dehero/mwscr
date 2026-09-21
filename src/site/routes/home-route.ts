import { lazy } from 'solid-js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.ts';
import type { HomePageData } from '../pages/HomePage/HomePage.data.ts';
import { queryHomePageData } from '../pages/HomePage/HomePage.data.ts';
import { texts } from '../texts/index.ts';

export const homeRoute: SiteRoute<SiteRouteParams, HomePageData> = {
  path: '/',
  info: () => ({
    label: texts.app.home,
  }),
  createUrl: () => '/',
  component: lazy(() => import('../pages/HomePage/HomePage.tsx')),
  preload: () => queryHomePageData(),
};
