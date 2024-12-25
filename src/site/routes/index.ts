import { resolveRoute } from 'vike/routing';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { errorRoute } from './error-route.js';
import { helpRoute } from './help-route.js';
import { homeRoute } from './home-route.js';
import { locationsRoute } from './locations-route.js';
import { postRoute } from './post-route.js';
import { postsRoute } from './posts-route.js';
import { userRoute } from './user-route.js';
import { usersRoute } from './users-route.js';

export const routes = [homeRoute, helpRoute, usersRoute, userRoute, locationsRoute, postRoute, postsRoute, errorRoute];

export interface RouteMatch {
  route: SiteRoute;
  params?: SiteRouteParams;
}

export function resolveFirstRoute(pathname: string): RouteMatch {
  for (const route of routes) {
    const { match, routeParams } = resolveRoute(route.path, pathname);
    if (route.guard && !route.guard(routeParams as never)) continue;

    if (match) {
      return { route: route as SiteRoute, params: route.mapParams ? route.mapParams(routeParams) : routeParams };
    }
  }

  return { route: errorRoute, params: undefined };
}
