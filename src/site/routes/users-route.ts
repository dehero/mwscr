import type { SiteRoute } from '../../core/entities/site-route.js';

export const usersRoute: SiteRoute<undefined> = {
  path: '/users',
  info: () => ({
    title: 'Users',
  }),
  createUrl: () => `/users/`,
};
