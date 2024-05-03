import type { SiteRoute } from '../../core/entities/site-route.js';
import { TrashPage } from '../pages/TrashPage/TrashPage.jsx';

export const trashRoute: SiteRoute = {
  path: '/trash/',
  component: TrashPage,
  info: {
    label: 'Trash',
  },
  createUrl: () => '/trash/',
};
