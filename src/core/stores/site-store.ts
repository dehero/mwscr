import type { Store } from '../entities/store.js';

export const SITE_STORE_URL = 'https://mwscr.dehero.site/store/';

export class SiteStore implements Store {
  include = ['shots/*.png', 'drawings/*.png'];

  getPublicUrl(path: string): string | undefined {
    return `${SITE_STORE_URL}${path}`;
  }
}

export const siteStore = new SiteStore();
