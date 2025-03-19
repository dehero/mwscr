import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { getHelpPageData, type HelpPageData } from '../components/HelpPage/HelpPage.data.js';

export interface HelpRouteParams extends SiteRouteParams {
  topicId: string;
}

export const helpRoute: SiteRoute<HelpRouteParams, HelpPageData> = {
  path: '/help*',
  meta: (params, data) => {
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
};
