import type { PageContext } from 'vike/types';
import { dataManager } from '../../../local/data-managers/manager.js';
import { getPostsPageData } from '../../components/PostsPage/PostsPage.data.js';
import type { PostsRouteParams } from '../../routes/posts-route.js';

export const data = (pageContext: PageContext) =>
  getPostsPageData(dataManager, pageContext.routeParams as PostsRouteParams);
