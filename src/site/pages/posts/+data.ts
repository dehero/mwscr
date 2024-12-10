import type { PageContext } from 'vike/types';
import { dataExtractor } from '../../../local/data-managers/extractor.js';
import { getPostsPageData } from '../../components/PostsPage/PostsPage.data.js';
import type { PostsRouteParams } from '../../routes/posts-route.js';

export const data = (pageContext: PageContext) =>
  getPostsPageData(dataExtractor, pageContext.routeParams as PostsRouteParams);
