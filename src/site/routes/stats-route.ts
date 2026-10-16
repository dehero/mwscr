import { lazy } from 'solid-js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.ts';
import type { StatsPageData } from '../pages/StatsPage/StatsPage.data.ts';
import { queryStatsPageData } from '../pages/StatsPage/StatsPage.data.ts';
import { texts } from '../texts/index.ts';
import { homeRoute } from './home-route.ts';

export const statsRoute: SiteRoute<SiteRouteParams, StatsPageData> = {
  path: '/stats',
  info: () => ({
    label: texts.stats.stats,
  }),
  createUrl: () => '/stats/',
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  component: lazy(() => import('../pages/StatsPage/StatsPage.tsx')),
  preload: () => queryStatsPageData(),
};
