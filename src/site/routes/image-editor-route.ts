import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import { texts } from '../texts/index.js';
import { homeRoute } from './home-route.js';

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
  component: lazy(() => import('../pages/ImageEditorPage/ImageEditorPage.jsx')),
};
