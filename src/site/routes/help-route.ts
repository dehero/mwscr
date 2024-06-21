import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { HelpPageData } from '../components/HelpPage/HelpPage.js';

export interface HelpRouteParams extends SiteRouteParams {
  topicId: string;
}

export const helpRoute: SiteRoute<HelpRouteParams, HelpPageData> = {
  path: '/help*',
  info: (params, data) => {
    const topicTitle = data?.topics[params.topicId]?.title || params.topicId;
    return {
      title: topicTitle || 'Help',
      description: topicTitle
        ? `Information about "${topicTitle}" in Morrowind Screenshots project.`
        : 'Information about Morrowind Screenshots project.',
    };
  },
  createUrl: ({ topicId }) => `/help/${topicId ? `${topicId}/` : ''}`,
  mapParams: (params) => ({
    topicId: params['*']?.replace(/\//g, '') || '',
  }),
};
