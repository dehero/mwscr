import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import type { UserPageData, UserPageParams } from '../pages/UserPage/UserPage.data.js';
import { queryUserPageData } from '../pages/UserPage/UserPage.data.js';
import { usersRoute } from './users-route.js';

export const userRoute: SiteRoute<UserPageParams, UserPageData> = {
  path: '/users/:id',
  info: (params) => ({ label: params.id || 'User' }),
  createUrl: (params) => `/users/${params.id}/`,
  parent: () => ({
    route: usersRoute,
    params: {},
  }),
  component: lazy(() => import('../pages/UserPage/UserPage.jsx')),
  preload: ({ params }) => queryUserPageData(params),
};
