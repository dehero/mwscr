import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { type PostsPageInfo, postsPageInfos } from '../components/PostsPage/PostsPage.js';

export interface PostsRouteParams extends SiteRouteParams {
  managerName: string;
}

export const postsRoute: SiteRoute<PostsRouteParams, PostsPageInfo> = {
  path: '/@managerName',
  info: ({ managerName }) =>
    postsPageInfos[managerName] ?? {
      title: 'Posts',
    },
  createUrl: ({ managerName }) => `/${managerName}/`,
};
