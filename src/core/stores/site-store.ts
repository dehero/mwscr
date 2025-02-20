import type { Store } from '../entities/store.js';
import { site } from '../services/site.js';

export class SiteStore implements Store {
  include = ['shots/*.png', 'drawings/*.png', 'wallpapers/*.png', 'videos/*.mp4'];

  getPublicUrl(path: string): string | undefined {
    return `${site.origin}/store/${path}`;
  }

  getPreviewUrl(path: string) {
    return `${site.origin}/previews/${path.replace(/(.*)\..*/, '/previews/$1.avif')}`;
  }
}

export const siteStore = new SiteStore();
