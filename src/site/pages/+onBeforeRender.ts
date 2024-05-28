import type { PageContext } from 'vike/types';
import { resolveFirstRoute } from '../routes/index.js';

export function onBeforeRender(pageContext: PageContext) {
  const { route, params } = resolveFirstRoute(pageContext.urlPathname);
  const routeInfo = route?.info(params as never);

  return {
    pageContext: {
      routeInfo,
    },
  };
}
