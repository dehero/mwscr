import type { Store } from '../entities/store.js';

export const SITE_URL = 'https://mwscr.dehero.site';

export class SiteStore implements Store {
  include = ['shots/*.png', 'drawings/*.png'];

  getPublicUrl(path: string): string | undefined {
    return `${SITE_URL}/store/${path}`;
  }

  getPreviewUrl(path: string) {
    return `${SITE_URL}/previews/${path.replace(/(.*)\..*/, '/previews/$1.avif')}`;
  }
}

export const siteStore = new SiteStore();
