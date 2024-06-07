import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { type PostsPageInfo } from '../components/PostsPage/PostsPage.js';

export interface PostsRouteParams extends SiteRouteParams {
  managerName: string;
}

export const postsRouteInfos: Record<string, PostsPageInfo> = {
  published: {
    label: 'Published',
    title: 'Published',
    presetKeys: ['editors-choice', 'unlocated', 'requests'],
    filters: ['author', 'location', 'mark', 'tag', 'type', 'requested', 'reposted'],
  },
  inbox: {
    label: 'Inbox',
    title: 'Inbox',
    sortKeys: ['id'],
    presetKeys: ['shortlist', 'requests'],
    filters: ['author', 'publishable', 'requested', 'location', 'mark', 'type'],
  },
  trash: {
    label: 'Trash',
    title: 'Trash',
    sortKeys: ['id'],
    presetKeys: ['revisit', 'violations'],
    filters: ['mark', 'violation', 'location', 'type'],
  },
};

export const postsRoute: SiteRoute<PostsRouteParams, PostsPageInfo> = {
  path: '/@managerName',
  info: ({ managerName }) =>
    postsRouteInfos[managerName] ?? {
      title: 'Posts',
    },
  createUrl: ({ managerName }) => `/${managerName}/`,
};
