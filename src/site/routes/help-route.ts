import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { HelpPageData } from '../components/HelpPage/HelpPage.jsx';

export interface HelpRouteParams extends SiteRouteParams {
  topicId: string;
}

export const helpRoute: SiteRoute<HelpRouteParams, HelpPageData> = {
  path: '/help*',
  info: (params, data) => ({
    title: data?.topics[params.topicId]?.title || 'Help',
  }),
  createUrl: ({ topicId }) => `/help/${topicId ? `${topicId}/` : ''}`,
  mapParams: (params) => ({
    topicId: params['*']?.replace(/\//g, '') || '',
  }),
};
