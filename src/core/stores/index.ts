import { type Store, storeIncludesPath } from '../entities/store.js';
import { siteStore } from './site-store.js';

export const stores: Store[] = [siteStore];

export const store: Store = {
  getPublicUrl(path: string): string | undefined {
    for (const store of stores.filter(storeIncludesPath(path))) {
      const url = store.getPublicUrl(path);
      if (url) {
        return url;
      }
    }

    return undefined;
  },
};
