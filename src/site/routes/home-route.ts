import { query } from '@solidjs/router';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { HomePageData } from '../pages/HomePage/HomePage.data.js';
import { getHomePageData } from '../pages/HomePage/HomePage.data.js';
import { dataManager } from '../data-managers/manager.js';
import { lazy } from 'solid-js';

const queryHomePageData = query(async () => getHomePageData(dataManager), 'home');
const preload = () => queryHomePageData();

export const homeRoute: SiteRoute<SiteRouteParams, HomePageData> = {
  path: '/',
  info: () => ({
    label: 'Home',
    title: '',
  }),
  createUrl: () => '/',
  component: lazy(() => import('../pages/HomePage/HomePage.jsx')),
  preload,
};
