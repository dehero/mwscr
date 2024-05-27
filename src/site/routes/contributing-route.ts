import type { SiteRoute } from '../../core/entities/site-route.js';

export const contributingRoute: SiteRoute<undefined> = {
  path: '/contributing',
  info: () => ({
    title: 'Contributing',
  }),
  createUrl: () => '/contributing/',
};
