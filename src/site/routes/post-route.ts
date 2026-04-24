import { query, RoutePreloadFuncArgs } from '@solidjs/router';
import { createPostPath, type PostsManagerName } from '../../core/entities/posts-manager.js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostPageData } from '../pages/PostPage/PostPage.data.js';
import { getPostPageData } from '../pages/PostPage/PostPage.data.js';
import type { PostPageSearchParams } from '../pages/PostPage/PostPage.jsx';
import { dataManager } from '../data-managers/manager.js';
import { lazy } from 'solid-js';

const queryPostPageData = query(async (params) => getPostPageData(dataManager, params), 'post');

export interface PostRouteParams extends SiteRouteParams, PostPageSearchParams {
  managerName: PostsManagerName;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams, PostPageData> = {
  path: '/:managerName/:id',
  info: (params) => ({
    title: params.id,
    description: `Information, content, statistics and comments of ${params.managerName} post "${params.id}" in Morrowind Screenshots project.`,
    // imageUrl: data?.content,
  }),
  createUrl: (params) => {
    const { managerName, id, ...rest } = params;
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${createPostPath(managerName, id)}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  component: lazy(() => import('../pages/PostPage/PostPage.jsx')),
  preload: ({ params }) => queryPostPageData(params),
};
