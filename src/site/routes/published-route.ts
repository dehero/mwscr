import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { published } from '../data-managers/posts.js';
import type { PostsPageRouteInfo } from '../pages/PostsPage/PostsPage.js';
import { PostsPage } from '../pages/PostsPage/PostsPage.js';

export const publishedRoute: SiteRoute<SiteRouteParams, PostsPageRouteInfo> = {
  path: '/published/',
  component: PostsPage,
  info: {
    label: 'Posts',
    manager: published,
    title: 'Posts',
    presetKeys: ['editors-choice', 'unlocated', 'requests'],
    filters: ['author', 'location', 'mark', 'tag', 'type'],
  },
  createUrl: () => '/published/',
};
