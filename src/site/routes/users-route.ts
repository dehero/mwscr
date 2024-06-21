import type { SiteRoute } from '../../core/entities/site-route.js';

export const usersRoute: SiteRoute<never> = {
  path: '/users',
  info: () => ({
    title: 'Users',
    description: 'List of users of Morrowind Screenshots project.',
  }),
  createUrl: () => `/users/`,
};
