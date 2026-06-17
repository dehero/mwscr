import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import type { HelpPageData, HelpPageParams } from '../pages/HelpPage/HelpPage.data.js';
import { queryHelpPageData } from '../pages/HelpPage/HelpPage.data.js';
import { homeRoute } from './home-route.js';

export const helpRoute: SiteRoute<HelpPageParams, HelpPageData> = {
  path: '/help/:topicId?',
  info: (params) => ({
    label: params.topicId || 'Help',
  }),
  createUrl: (params) => `/help/${params.topicId ? `${params.topicId}/` : ''}`,
  parent: ({ topicId }) =>
    topicId
      ? {
          route: helpRoute,
          params: { topicId: '' },
        }
      : {
          route: homeRoute,
          params: {},
        },
  component: lazy(() => import('../pages/HelpPage/HelpPage.jsx')),
  preload: ({ params }) => queryHelpPageData(params),
};
