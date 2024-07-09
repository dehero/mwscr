import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostPageData } from '../components/PostPage/PostPage.js';

export interface PostRouteParams extends SiteRouteParams {
  managerName: string;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams, PostPageData> = {
  path: '/@managerName/@id',
  info: (params, data) => ({
    title: data?.post?.title || params.id,
    description: `Information, content, statistics and comments of ${params.managerName} post "${
      data?.post?.title || params.id
    }" in Morrowind Screenshots project.`,
    imageUrl: data?.post?.content,
  }),
  createUrl: (params) => `/${params.managerName}/${params.id}/`,
};
