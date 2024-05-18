import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { UserPage } from '../pages/UserPage/UserPage.js';

export interface UserRouteParams extends SiteRouteParams {
  id: string;
}

export const userRoute: SiteRoute<UserRouteParams> = {
  path: '/users/:id/',
  component: UserPage,
  info: {
    label: 'User',
  },
  createUrl: ({ id }) => `/users/${id}/`,
};
