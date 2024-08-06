import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostsPageData, PostsPageInfo, PostsPageSearchParams } from '../components/PostsPage/PostsPage.js';

export interface PostsRouteParams extends SiteRouteParams, PostsPageSearchParams {
  managerName: string;
}

export const postsRouteInfos: Record<string, PostsPageInfo> = {
  posts: {
    label: 'Posts',
    title: 'Posts',
    description: 'Published posts of Morrowind Screenshots project.',
    presetKeys: ['editors-choice', 'unlocated', 'requests'],
    filters: ['date', 'author', 'location', 'mark', 'tag', 'type', 'requester', 'original'],
  },
  inbox: {
    label: 'Inbox',
    title: 'Inbox',
    description: 'Pending posts of Morrowind Screenshots project.',
    sortKeys: ['date', 'id'],
    presetKeys: ['requests'],
    filters: ['date', 'author', 'publishable', 'requester', 'location', 'mark', 'type'],
  },
  trash: {
    label: 'Trash',
    title: 'Trash',
    description: 'Rejected posts of Morrowind Screenshots project.',
    sortKeys: ['date', 'id'],
    presetKeys: ['revisit', 'violations'],
    filters: ['date', 'mark', 'violation', 'location', 'type', 'author'],
  },
};

export const postsRoute: SiteRoute<PostsRouteParams, PostsPageData, PostsPageInfo> = {
  path: '/@managerName',
  guard: ({ managerName }) => Object.keys(postsRouteInfos).includes(managerName),
  info: ({ managerName }, data) => ({
    ...(postsRouteInfos[managerName] ?? {
      title: 'Posts',
      description: 'Posts of Morrowind Screenshots project.',
    }),
    imageUrl: data?.postInfos[0]?.content,
  }),
  createUrl: (params) => {
    const { managerName, ...rest } = params;
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${managerName}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
};
