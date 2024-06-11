import { usePageContext } from 'vike-solid/usePageContext';
import type { SiteRouteInfo } from '../../core/entities/site-route.js';

export function useRouteInfo<TInfo extends SiteRouteInfo = SiteRouteInfo>() {
  return usePageContext().routeInfo as TInfo;
}
