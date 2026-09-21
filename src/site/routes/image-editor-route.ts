import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.ts';
import { texts } from '../texts/index.ts';
import { homeRoute } from './home-route.ts';

export const imageEditorRoute: SiteRoute = {
  path: '/image-editor',
  info: () => ({
    label: texts.app.imageEditor,
  }),
  parent: () => ({
    route: homeRoute,
    params: {},
  }),
  createUrl: () => '/image-editor/',
  component: lazy(() => import('../pages/ImageEditorPage/ImageEditorPage.tsx')),
};
