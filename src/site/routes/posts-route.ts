import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { lazy } from 'solid-js';
import { postsManagerDescriptors, PostsManagerName } from '../../core/entities/posts-manager.js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import { type PostsPageData, type PostsPageParams, queryPostsPageData } from '../pages/PostsPage/PostsPage.data.js';

export const postsRoute: SiteRoute<PostsPageParams, PostsPageData> = {
  path: '/:managerName',
  matchFilters: {
    managerName: PostsManagerName.options,
  },
  info: ({ managerName }) => {
    const descriptor = postsManagerDescriptors[managerName];

    return {
      title: descriptor.title,
      label: descriptor.title,
      description: `${descriptor.title} or Morrowind Screenshots project.`,
    };
  },
  createUrl: (params) => {
    const { managerName, ...rest } = params;
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${managerName}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  component: lazy(() => import('../pages/PostsPage/PostsPage.jsx')),
  preload: ({ params }: RoutePreloadFuncArgs) => queryPostsPageData(params),
};
