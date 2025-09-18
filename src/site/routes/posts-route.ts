import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import type { PostsPageData, PostsPageParams } from '../components/PostsPage/PostsPage.data.js';
import { getPostsPageData } from '../components/PostsPage/PostsPage.data.js';
import type { PostsPageInfo } from '../components/PostsPage/PostsPage.js';

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
    typeKeys: ['shot', 'shot-set', 'clip', 'video', 'wallpaper', 'wallpaper-v'],
  },
  extras: {
    label: 'Extras',
    title: 'Extras',
    description: 'Extras of Morrowind Screenshots project.',
    presetKeys: ['edits'],
    typeKeys: ['news', 'mention', 'photoshop', 'redrawing', 'outtakes', 'achievement'],
    filters: ['date', 'author', 'original', 'tag', 'type', 'status'],
  },
  drafts: {
    label: 'Drafts',
    title: 'Drafts',
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
  rejects: {
    label: 'Rejects',
    title: 'Rejects',
    description: 'Rejected posts of Morrowind Screenshots project.',
    sortKeys: ['date', 'id'],
    presetKeys: ['revisit', 'violations', 'edits'],
    filters: ['date', 'mark', 'violation', 'location', 'tag', 'type', 'author', 'status', 'placement', 'addon'],
  },
};

export const postsRoute: SiteRoute<PostsPageParams, PostsPageData, PostsPageInfo> = {
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
