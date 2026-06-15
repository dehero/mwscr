import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import type { UserPageData, UserPageParams } from '../pages/UserPage/UserPage.data.js';
import { queryUserPageData } from '../pages/UserPage/UserPage.data.js';

export const userRoute: SiteRoute<UserPageParams, UserPageData> = {
  path: '/users/:id',
  info: (params) => ({
    title: params.id,
    description: `Information, profiles, comments, posts, requests and statistics of "${params.id}" in Morrowind Screenshots project.`,
  }),
  createUrl: (params) => `/users/${params.id}/`,
  component: lazy(() => import('../pages/UserPage/UserPage.jsx')),
  preload: ({ params }) => queryUserPageData(params),
};
