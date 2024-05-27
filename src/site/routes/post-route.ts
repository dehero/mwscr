import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';

export interface PostRouteParams extends SiteRouteParams {
  managerName: string;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams> = {
  path: '/@managerName/@id',
  info: () => ({
    title: 'Post',
  }),
  createUrl: ({ managerName, id }) => `/${managerName}/${id}/`,
};
