import type { SiteRoute } from '../../core/entities/site-route.js';

export const homeRoute: SiteRoute<undefined> = {
  path: '/',
  info: () => ({
    label: 'Home',
    title: '',
  }),
  createUrl: () => '/',
};
