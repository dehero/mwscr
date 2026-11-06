import { lazy } from 'solid-js';
import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.ts';
import type { CommentsPageData } from '../pages/CommentsPage/CommentsPage.data.ts';
import { queryCommentsPageData } from '../pages/CommentsPage/CommentsPage.data.ts';
import { texts } from '../texts/index.ts';
import { homeRoute } from './home-route.ts';

export const commentsRoute: SiteRoute<SiteRouteParams, CommentsPageData> = {
  path: '/comments',
  info: () => ({
    label: texts.app.comments,
  }),
  createUrl: () => '/comments/',
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  component: lazy(() => import('../pages/CommentsPage/CommentsPage.tsx')),
  preload: () => queryCommentsPageData(),
};
