import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.ts';
import type { UserPageData, UserPageParams } from '../pages/UserPage/UserPage.data.ts';
import { queryUserPageData } from '../pages/UserPage/UserPage.data.ts';
import { texts } from '../texts/index.ts';
import { usersRoute } from './users-route.ts';

export const userRoute: SiteRoute<UserPageParams, UserPageData> = {
  path: '/users/:id',
  info: (params) => ({ label: params.id || texts.user.user }),
  createUrl: (params) => `/users/${params.id}/`,
  parent: () => ({
    route: usersRoute,
    params: {},
  }),
  component: lazy(() => import('../pages/UserPage/UserPage.tsx')),
  preload: ({ params }) => queryUserPageData(params),
};
