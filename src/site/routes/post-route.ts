import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostPageData } from '../components/PostPage/PostPage.jsx';

export interface PostRouteParams extends SiteRouteParams {
  managerName: string;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams, PostPageData> = {
  path: '/@managerName/@id',
  info: (params, data) => ({
    title: data?.post?.title || params.id,
  }),
  createUrl: ({ managerName, id }) => `/${managerName}/${id}/`,
};
