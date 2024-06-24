import type { PageContext } from 'vike/types';
import type { SiteRouteInfo } from '../../core/entities/site-route.js';
import { resolveFirstRoute } from '../routes/index.js';

// pageContext: ReturnType<typeof usePageContext>

export function useRouteInfo<TInfo extends SiteRouteInfo = SiteRouteInfo>(pageContext: PageContext) {
  const { route, params } = resolveFirstRoute(pageContext.urlPathname);

  return route?.info(params as never, pageContext.data as never) as TInfo | undefined;
}
