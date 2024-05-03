import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { PostPage } from '../pages/PostPage/PostPage.jsx';

export interface PostRouteParams extends SiteRouteParams {
  managerName: string;
  id: string;
}

export const postRoute: SiteRoute<PostRouteParams> = {
  path: '/:managerName/:id/',
  component: PostPage,
  info: {
    label: 'Post',
  },
  createUrl: ({ managerName, id }) => `/${managerName}/${id}/`,
};
