import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { lazy } from 'solid-js';
import { postsManagerDescriptors, PostsManagerName } from '../../core/entities/posts-manager.ts';
import type { SiteRoute } from '../../core/entities/site-route.ts';
import { type PostsPageData, type PostsPageParams, queryPostsPageData } from '../pages/PostsPage/PostsPage.data.ts';
import { homeRoute } from './home-route.ts';

export const postsRoute: SiteRoute<PostsPageParams, PostsPageData> = {
  path: '/:managerName',
  matchFilters: {
    managerName: PostsManagerName.options,
  },
  info: ({ managerName }) => ({
    label: postsManagerDescriptors[managerName].title,
  }),
  createUrl: (params) => {
    const { managerName, ...rest } = params;
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${managerName}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  component: lazy(() => import('../pages/PostsPage/PostsPage.tsx')),
  preload: ({ params }: RoutePreloadFuncArgs) => queryPostsPageData(params),
};
