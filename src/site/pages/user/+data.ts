import type { PageContext } from 'vike/types';
import { dataManager } from '../../../scripts/data-managers/manager.js';
import { getUserPageData } from '../../components/UserPage/UserPage.data.js';
import type { UserRouteParams } from '../../routes/user-route.js';

export const data = (pageContext: PageContext) =>
  getUserPageData(dataManager, pageContext.routeParams as UserRouteParams);
