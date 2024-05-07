import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { trash } from '../data-managers/posts.js';
import type { PostsPageRouteInfo } from '../pages/PostsPage/PostsPage.js';
import { PostsPage } from '../pages/PostsPage/PostsPage.js';

export const trashRoute: SiteRoute<SiteRouteParams, PostsPageRouteInfo> = {
  path: '/trash/',
  component: PostsPage,
  info: {
    label: 'Trash',
    manager: trash,
    title: 'Trash',
    sortKeys: ['id'],
    presetKeys: ['revisit', 'violations'],
    filters: ['mark', 'violation', 'location', 'type'],
  },
  createUrl: () => '/trash/',
};
