import type { SiteRoute } from '../../core/entities/site-route.js';
import { UsersPage } from '../pages/UsersPage/UsersPage.js';

export const usersRoute: SiteRoute = {
  path: '/users/',
  component: UsersPage,
  info: {
    label: 'Users',
  },
  createUrl: () => `/users/`,
};
