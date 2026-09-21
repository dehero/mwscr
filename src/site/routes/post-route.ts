import { lazy } from 'solid-js';
import { createPostPath } from '../../core/entities/posts-manager.ts';
import type { SiteRoute } from '../../core/entities/site-route.ts';
import type { PostPageData, PostPageParams } from '../pages/PostPage/PostPage.data.ts';
import { queryPostPageData } from '../pages/PostPage/PostPage.data.ts';
import { texts } from '../texts/index.ts';
import { postsRoute } from './posts-route.ts';

export const postRoute: SiteRoute<PostPageParams, PostPageData> = {
  path: '/:managerName/:id',
  info: (params) => ({ label: params.id || texts.post.post }),
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
  component: lazy(() => import('../pages/PostPage/PostPage.tsx')),
  preload: ({ params }) => queryPostPageData(params),
};
