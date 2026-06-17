import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';

export const imageEditorRoute: SiteRoute = {
  path: '/image-editor',
  info: () => ({
    label: 'Image Editor',
  }),
  createUrl: () => '/image-editor',
  component: lazy(() => import('../pages/ImageEditorPage/ImageEditorPage.jsx')),
};
