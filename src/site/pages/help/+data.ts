import type { PageContext } from 'vike/types';
import { dataManager } from '../../../scripts/data-managers/manager.js';
import { getHelpPageData } from '../../components/HelpPage/HelpPage.data.js';
import type { HelpRouteParams } from '../../routes/help-route.js';

export const data = (pageContext: PageContext) =>
  getHelpPageData(dataManager, pageContext.routeParams as HelpRouteParams);
