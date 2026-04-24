import type { SiteRoute } from '../../core/entities/site-route.js';
import { lazy } from 'solid-js';

export const imageEditorRoute: SiteRoute = {
  path: '/image-editor',
  info: () => ({
    label: 'Image Editor',
    title: 'Image Editor',
  }),
  createUrl: () => '/image-editor',
  component: lazy(() => import('../pages/ImageEditorPage/ImageEditorPage.jsx')),
};
