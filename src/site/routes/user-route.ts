import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';

export interface UserRouteParams extends SiteRouteParams {
  id: string;
}

export const userRoute: SiteRoute<UserRouteParams> = {
  path: '/users/@id',
  info: () => ({
    title: 'User',
  }),
  createUrl: ({ id }) => `/users/${id}/`,
};
