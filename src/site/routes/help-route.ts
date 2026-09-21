import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.ts';
import type { HelpPageData, HelpPageParams } from '../pages/HelpPage/HelpPage.data.ts';
import { queryHelpPageData } from '../pages/HelpPage/HelpPage.data.ts';
import { texts } from '../texts/index.ts';
import { homeRoute } from './home-route.ts';

export const helpRoute: SiteRoute<HelpPageParams, HelpPageData> = {
  path: '/help/:topicId?',
  info: (params) => ({
    label: params.topicId || texts.app.help,
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
  component: lazy(() => import('../pages/HelpPage/HelpPage.tsx')),
  preload: ({ params }) => queryHelpPageData(params),
};
