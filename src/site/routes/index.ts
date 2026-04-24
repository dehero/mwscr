import { RouteDefinition } from '@solidjs/router';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { errorRoute } from './error-route.js';
import { helpRoute } from './help-route.js';
import { homeRoute } from './home-route.js';
import { imageEditorRoute } from './image-editor-route.js';
import { postRoute } from './post-route.js';
import { postsRoute } from './posts-route.js';
import { userRoute } from './user-route.js';
import { usersRoute } from './users-route.js';

export const routes = [
  homeRoute as RouteDefinition,
  // helpRoute,
  // usersRoute,
  // userRoute,
  postRoute as unknown as RouteDefinition,
  // postsRoute,
  // imageEditorRoute,
  // errorRoute,
];

export interface RouteMatch {
  route: SiteRoute;
  params?: SiteRouteParams;
}
