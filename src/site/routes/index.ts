import { resolveRoute } from 'vike/routing';
import { helpRoute } from './help-route.js';
import { homeRoute } from './home-route.js';
import { postRoute } from './post-route.js';
import { postsRoute } from './posts-route.js';
import { userRoute } from './user-route.js';
import { usersRoute } from './users-route.js';

export const routes = [homeRoute, helpRoute, usersRoute, userRoute, postRoute, postsRoute];

export function resolveFirstRoute(pathname: string) {
  for (const route of routes) {
    const { match, routeParams } = resolveRoute(route.path, pathname);
    if (match) {
      return { route, params: route.mapParams ? route.mapParams(routeParams) : routeParams };
    }
  }

  return { route: undefined, params: undefined };
}
