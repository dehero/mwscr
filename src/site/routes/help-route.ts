import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';

export interface HelpRouteParams extends SiteRouteParams {
  topicId: string;
}

export const helpRoute: SiteRoute<HelpRouteParams> = {
  path: '/help*',
  info: () => ({
    title: 'Help',
  }),
  createUrl: ({ topicId }) => `/help/${topicId ? `${topicId}/` : ''}`,
};
