import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostPageData } from '../components/PostPage/PostPage.data.js';
import { getPostPageData } from '../components/PostPage/PostPage.data.js';

export interface PostRouteParams extends SiteRouteParams {
  managerName: PostsManagerName;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams, PostPageData> = {
  path: '/@managerName/@id',
  meta: (params, data) => ({
    title: data?.post?.title || params.id,
    description: `Information, content, statistics and comments of ${params.managerName} post "${
      data?.post?.title || params.id
    }" in Morrowind Screenshots project.`,
    imageUrl: data?.post?.content,
  }),
  createUrl: (params) => `/${params.managerName}/${params.id}/`,
  getData: getPostPageData,
};
