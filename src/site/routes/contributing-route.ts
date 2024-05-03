import type { SiteRoute } from '../../core/entities/site-route.js';
import { ContributingPage } from '../pages/ContributingPage/ContributingPage.jsx';

export const contributingRoute: SiteRoute = {
  path: '/contributing/',
  component: ContributingPage,
  info: {
    label: 'Contributing',
  },
  createUrl: () => '/contributing/',
};
