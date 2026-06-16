import { lazy } from 'solid-js';
import { createPostPath } from '../../core/entities/posts-manager.js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import { postsRoute } from './posts-route.js';
import type { PostPageData, PostPageParams } from '../pages/PostPage/PostPage.data.js';
import { queryPostPageData } from '../pages/PostPage/PostPage.data.js';

export const postRoute: SiteRoute<PostPageParams, PostPageData> = {
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
  parent: (params) => ({
    route: postsRoute,
    params: { managerName: params.managerName },
  }),
  component: lazy(() => import('../pages/PostPage/PostPage.jsx')),
  preload: ({ params }) => queryPostPageData(params),
};
