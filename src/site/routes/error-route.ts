import type { SiteRoute } from '../../core/entities/site-route.js';

export const errorRoute: SiteRoute = {
  path: '/*',
  meta: () => ({
    title: 'Error',
  }),
  createUrl: () => '/error/',
  getData: async () => undefined,
};
