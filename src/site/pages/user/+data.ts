import type { PageContext } from 'vike/types';
import { dataExtractor } from '../../../local/data-managers/extractor.js';
import { getUserPageData } from '../../components/UserPage/UserPage.data.js';
import type { UserRouteParams } from '../../routes/user-route.js';

export const data = (pageContext: PageContext) =>
  getUserPageData(dataExtractor, pageContext.routeParams as UserRouteParams);
