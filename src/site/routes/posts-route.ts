import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { getPostsPageData, type PostsPageData } from '../components/PostsPage/PostsPage.data.js';
import type { PostsPageInfo, PostsPageSearchParams } from '../components/PostsPage/PostsPage.js';

export interface PostsRouteParams extends SiteRouteParams, PostsPageSearchParams {
  managerName: PostsManagerName;
}

export const postsRouteInfos: Record<PostsManagerName, PostsPageInfo> = {
  posts: {
    label: 'Posts',
    title: 'Posts',
    description: 'Posts of Morrowind Screenshots project.',
    presetKeys: ['editors-choice', 'unlocated', 'requests', 'edits'],
    filters: [
      'date',
      'author',
      'location',
      'mark',
      'tag',
      'type',
      'requester',
      'original',
      'status',
      'placement',
      'addon',
      'official',
    ],
  },
  inbox: {
    label: 'Inbox',
    title: 'Inbox',
    description: 'Pending posts of Morrowind Screenshots project.',
    sortKeys: ['date', 'id'],
    presetKeys: ['shortlist', 'requests', 'edits'],
    filters: [
      'date',
      'author',
      'publishable',
      'requester',
      'location',
      'mark',
      'tag',
      'type',
      'status',
      'placement',
      'addon',
      'official',
    ],
  },
  trash: {
    label: 'Trash',
    title: 'Trash',
    description: 'Rejected posts of Morrowind Screenshots project.',
    sortKeys: ['date', 'id'],
    presetKeys: ['revisit', 'violations', 'edits'],
    filters: ['date', 'mark', 'violation', 'location', 'tag', 'type', 'author', 'status', 'placement', 'addon'],
  },
};

export const postsRoute: SiteRoute<PostsRouteParams, PostsPageData, PostsPageInfo> = {
  path: '/@managerName',
  guard: ({ managerName }) => Object.keys(postsRouteInfos).includes(managerName),
  meta: ({ managerName }) => postsRouteInfos[managerName],
  createUrl: (params) => {
    const { managerName, ...rest } = params;
    const searchParams = new URLSearchParams(
      Object.entries(rest).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/${managerName}/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  getData: getPostsPageData,
};
