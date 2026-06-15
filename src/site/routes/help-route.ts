import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import type { HelpPageData, HelpPageParams } from '../pages/HelpPage/HelpPage.data.js';
import { queryHelpPageData } from '../pages/HelpPage/HelpPage.data.js';

export const helpRoute: SiteRoute<HelpPageParams, HelpPageData> = {
  path: '/help/:topicId?',
  info: (params) => {
    const topicTitle = params.topicId;
    return {
      title: topicTitle || 'Help',
      description: topicTitle
        ? `Information about "${topicTitle}" in Morrowind Screenshots project.`
        : 'Information about Morrowind Screenshots project.',
    };
  },
  createUrl: (params) => `/help/${params.topicId ? `${params.topicId}/` : ''}`,
  component: lazy(() => import('../pages/HelpPage/HelpPage.jsx')),
  preload: ({ params }) => queryHelpPageData(params),
};
