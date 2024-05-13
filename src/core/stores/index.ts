import { type StoreDescriptor, storeIncludesPath } from '../entities/store.js';
import * as site from './site-store.js';

export const storeDescriptors: StoreDescriptor[] = [site];

export const storeDescriptor: StoreDescriptor = {
  getPublicUrl(path: string): string | undefined {
    for (const store of storeDescriptors.filter(storeIncludesPath(path))) {
      const url = store.getPublicUrl(path);
      if (url) {
        return url;
      }
    }

    return undefined;
  },
};
