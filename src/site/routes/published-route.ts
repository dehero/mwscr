import type { SiteRoute } from '../../core/entities/site-route.js';
import { PublishedPage } from '../pages/PublishedPage/PublishedPage.jsx';

export const publishedRoute: SiteRoute = {
  path: '/published/',
  component: PublishedPage,
  info: {
    label: 'Published',
  },
  createUrl: () => '/published/',
};
