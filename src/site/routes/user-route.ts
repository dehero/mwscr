import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { UserPageData } from '../components/UserPage/UserPage.jsx';

export interface UserRouteParams extends SiteRouteParams {
  id: string;
}

export const userRoute: SiteRoute<UserRouteParams, UserPageData> = {
  path: '/users/@id',
  info: (params, data) => ({
    title: data?.userInfo?.title || params.id,
    description: `Information, posts, requests and statistics of "${
      data?.userInfo?.title || params.id
    }" in Morrowind Screenshots project.`,
  }),
  createUrl: ({ id }) => `/users/${id}/`,
};
