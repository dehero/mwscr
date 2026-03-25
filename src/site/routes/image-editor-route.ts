import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';

export const imageEditorRoute: SiteRoute<SiteRouteParams, undefined> = {
  path: '/image-editor',
  meta: () => ({
    label: 'Image Editor',
    title: 'Image Editor',
  }),
  createUrl: () => '/image-editor',
  getData: async () => undefined,
};
