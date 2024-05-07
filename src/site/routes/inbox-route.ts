import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { inbox } from '../data-managers/posts.js';
import type { PostsPageRouteInfo } from '../pages/PostsPage/PostsPage.js';
import { PostsPage } from '../pages/PostsPage/PostsPage.js';

export const inboxRoute: SiteRoute<SiteRouteParams, PostsPageRouteInfo> = {
  path: '/inbox/',
  component: PostsPage,
  info: {
    label: 'Inbox',
    manager: inbox,
    title: 'Inbox',
    sortKeys: ['id'],
    presetKeys: ['shortlist', 'requests'],
    filters: ['author', 'check', 'location', 'mark', 'type'],
  },
  createUrl: () => '/inbox/',
};
