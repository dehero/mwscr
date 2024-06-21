import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { PostsPageData, PostsPageInfo, PostsPageSearchParams } from '../components/PostsPage/PostsPage.js';

export interface PostsRouteParams extends SiteRouteParams, PostsPageSearchParams {
  managerName: string;
}

export const postsRouteInfos: Record<string, PostsPageInfo> = {
  published: {
    label: 'Posts',
    title: 'Posts',
    description: 'Published posts of Morrowind Screenshots project.',
    presetKeys: ['editors-choice', 'unlocated', 'requests'],
    filters: ['author', 'location', 'mark', 'tag', 'type', 'requested', 'original'],
  },
  inbox: {
    label: 'Inbox',
    title: 'Inbox',
    description: 'Pending posts of Morrowind Screenshots project.',
    sortKeys: ['id'],
    presetKeys: ['shortlist', 'requests'],
    filters: ['author', 'publishable', 'requested', 'location', 'mark', 'type'],
  },
  trash: {
    label: 'Trash',
    title: 'Trash',
    description: 'Rejected posts of Morrowind Screenshots project.',
    sortKeys: ['id'],
    presetKeys: ['revisit', 'violations'],
    filters: ['mark', 'violation', 'location', 'type'],
  },
};

export const postsRoute: SiteRoute<PostsRouteParams, PostsPageData, PostsPageInfo> = {
  path: '/@managerName',
  guard: ({ managerName }) => Object.keys(postsRouteInfos).includes(managerName),
  info: ({ managerName }) =>
    postsRouteInfos[managerName] ?? {
      title: 'Posts',
      description: 'Posts of Morrowind Screenshots project.',
    },
  createUrl: ({ managerName, ...rest }) => {
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${managerName}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
};
