import { resolveRoute } from 'vike/routing';
import type { PageContext } from 'vike/types';
import { routes } from '../routes/index.js';

export function onBeforeRender(pageContext: PageContext) {
  const pathname = pageContext.urlPathname;
  let match;
  let routeParams;
  let currentRoute;

  for (const route of routes) {
    ({ match, routeParams } = resolveRoute(route.path, pathname));
    if (match) {
      currentRoute = route;
      break;
    }
  }

  const routeInfo = currentRoute?.info(routeParams as never);

  return {
    pageContext: {
      routeInfo,
    },
  };
}
