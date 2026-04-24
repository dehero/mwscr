import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { UserPageData } from '../pages/UserPage/UserPage.data.js';
import { getUserPageData } from '../pages/UserPage/UserPage.data.js';
import { UserPage } from '../pages/UserPage/UserPage.jsx';

export interface UserRouteParams extends SiteRouteParams {
  id: string;
}

export const userRoute: SiteRoute<UserRouteParams, UserPageData> = {
  path: '/users/:id',
  info: (params, data) => ({
    title: data?.title || params.id,
    description: `Information, profiles, comments, posts, requests and statistics of "${
      data?.title || params.id
    }" in Morrowind Screenshots project.`,
  }),
  createUrl: (params) => `/users/${params.id}/`,
  getData: getUserPageData,
  component: UserPage,
};
