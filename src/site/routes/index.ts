import type { RouteDefinition } from '@solidjs/router';
import type { SiteRouteParams, SiteRouteReference } from '../../core/entities/site-route.ts';
import { errorRoute } from './error-route.ts';
import { helpRoute } from './help-route.ts';
import { homeRoute } from './home-route.ts';
import { imageEditorRoute } from './image-editor-route.ts';
import { postRoute } from './post-route.ts';
import { postsRoute } from './posts-route.ts';
import { userRoute } from './user-route.ts';
import { usersRoute } from './users-route.ts';

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
