import type { PageContext } from 'vike/types';
import { dataManager } from '../../../scripts/data-managers/manager.js';
import type { PostsPageParams } from '../../components/PostsPage/PostsPage.data.js';
import { getPostsPageData } from '../../components/PostsPage/PostsPage.data.js';

export const data = (pageContext: PageContext) =>
  getPostsPageData(dataManager, pageContext.routeParams as PostsPageParams);
