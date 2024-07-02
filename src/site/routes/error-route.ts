import type { SiteRoute } from '../../core/entities/site-route.js';

export const errorRoute: SiteRoute = {
  path: '/*',
  info: () => ({
    title: 'Error',
  }),
  createUrl: () => '/error/',
};
