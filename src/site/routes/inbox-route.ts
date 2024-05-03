import type { SiteRoute } from '../../core/entities/site-route.js';
import { InboxPage } from '../pages/InboxPage/InboxPage.jsx';

export const inboxRoute: SiteRoute = {
  path: '/inbox/',
  component: InboxPage,
  info: {
    label: 'Inbox',
  },
  createUrl: () => '/inbox/',
};
