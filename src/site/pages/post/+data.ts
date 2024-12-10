import type { PageContext } from 'vike/types';
import { dataExtractor } from '../../../local/data-managers/extractor.js';
import { getPostPageData } from '../../components/PostPage/PostPage.data.js';
import type { PostRouteParams } from '../../routes/post-route.js';

export const data = (pageContext: PageContext) =>
  getPostPageData(dataExtractor, pageContext.routeParams as PostRouteParams);
