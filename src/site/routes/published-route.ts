import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { PublishedPage } from '../pages/PublishedPage/PublishedPage.js';

export interface PublishedRouteParams extends SiteRouteParams {
  type: string;
  tag: string;
  location: string;
  author: string;
  mark: string;
  search: string;
}

export const publishedRoute: SiteRoute = {
  path: '/published/',
  component: PublishedPage,
  info: {
    label: 'Published',
  },
  createUrl: () => '/published/',
};
