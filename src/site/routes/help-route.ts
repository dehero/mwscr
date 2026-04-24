import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { getHelpPageData, type HelpPageData } from '../pages/HelpPage/HelpPage.data.js';
import { HelpPage } from '../pages/HelpPage/HelpPage.jsx';

export interface HelpRouteParams extends SiteRouteParams {
  topicId: string;
}

export const helpRoute: SiteRoute<HelpRouteParams, HelpPageData> = {
  path: '/help/*',
  info: (params, data) => {
    const topicTitle = data?.topic?.title || data?.indexTopic.title || params.topicId;
    return {
      title: topicTitle || 'Help',
      description: topicTitle
        ? `Information about "${topicTitle}" in Morrowind Screenshots project.`
        : 'Information about Morrowind Screenshots project.',
    };
  },
  createUrl: (params) => `/help/${params.topicId ? `${params.topicId}/` : ''}`,
  mapParams: (params) => ({
    topicId: params['*']?.replace(/\//g, '') || '',
  }),
  getData: getHelpPageData,
  component: HelpPage,
};
