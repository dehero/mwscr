import type { PageContext } from 'vike/types';
import { dataManager } from '../../../scripts/data-managers/manager.js';
import { getPostPageData } from '../../components/PostPage/PostPage.data.js';
import type { PostRouteParams } from '../../routes/post-route.js';

export const data = (pageContext: PageContext) =>
  getPostPageData(dataManager, pageContext.routeParams as PostRouteParams);
