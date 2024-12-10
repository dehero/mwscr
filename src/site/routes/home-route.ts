import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { HomePageData } from '../components/HomePage/HomePage.data.js';
import { getHomePageData } from '../components/HomePage/HomePage.data.js';

export const homeRoute: SiteRoute<SiteRouteParams, HomePageData> = {
  path: '/',
  meta: () => ({
    label: 'Home',
    title: '',
  }),
  createUrl: () => '/',
  getData: getHomePageData,
};
