import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostPageData } from '../components/PostPage/PostPage.data.js';
import { getPostPageData } from '../components/PostPage/PostPage.data.js';
import type { PostPageSearchParams } from '../components/PostPage/PostPage.jsx';

export interface PostRouteParams extends SiteRouteParams, PostPageSearchParams {
  managerName: PostsManagerName;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams, PostPageData> = {
  path: '/@managerName/@id',
  meta: (params, data) => ({
    title: data?.title || params.id,
    description: `Information, content, statistics and comments of ${params.managerName} post "${
      data?.title || params.id
    }" in Morrowind Screenshots project.`,
    imageUrl: data?.content,
  }),
  createUrl: (params) => {
    const { managerName, id, ...rest } = params;
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${params.managerName}/${params.id}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  getData: getPostPageData,
  // dynamic: true,
};
