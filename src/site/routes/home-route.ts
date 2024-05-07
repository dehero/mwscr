import type { SiteRoute } from '../../core/entities/site-route.js';
import { AboutPage } from '../pages/AboutPage/AboutPage.js';

export const homeRoute: SiteRoute = {
  path: '/',
  component: AboutPage,
  info: {
    label: 'Home',
  },
  createUrl: () => '/',
};
