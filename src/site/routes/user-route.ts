import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { UserPageData } from '../components/UserPage/UserPage.data.js';
import { getUserPageData } from '../components/UserPage/UserPage.data.js';

export interface UserRouteParams extends SiteRouteParams {
  id: string;
}

export const userRoute: SiteRoute<UserRouteParams, UserPageData> = {
  path: '/users/@id',
  meta: (params, data) => ({
    title: data?.title || params.id,
    description: `Information, profiles, comments, posts, requests and statistics of "${
      data?.title || params.id
    }" in Morrowind Screenshots project.`,
  }),
  createUrl: (params) => `/users/${params.id}/`,
  getData: getUserPageData,
};
