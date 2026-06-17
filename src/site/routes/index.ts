import type { RouteDefinition } from '@solidjs/router';
import type { SiteRouteParams, SiteRouteReference } from '../../core/entities/site-route.js';
import { errorRoute } from './error-route.js';
import { helpRoute } from './help-route.js';
import { homeRoute } from './home-route.js';
import { imageEditorRoute } from './image-editor-route.js';
import { postRoute } from './post-route.js';
import { postsRoute } from './posts-route.js';
import { userRoute } from './user-route.js';
import { usersRoute } from './users-route.js';

export const routes: RouteDefinition[] = [
  homeRoute as RouteDefinition,
  helpRoute as unknown as RouteDefinition,
  usersRoute as unknown as RouteDefinition,
  userRoute as unknown as RouteDefinition,
  postRoute as unknown as RouteDefinition,
  postsRoute as unknown as RouteDefinition,
  imageEditorRoute as RouteDefinition,
  errorRoute as RouteDefinition,
];

export interface RouteMatch {
  route: SiteRouteReference;
  params?: SiteRouteParams;
}
