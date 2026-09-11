import { AbstractSiteStore } from '../../core/stores/abstract-site-store.js';
import { setStorageItemWithEvent } from '../utils/storage-utils.js';

export class SiteStore extends AbstractSiteStore {
  getSecretKey() {
    return localStorage.getItem('store.secretKey') ?? undefined;
  }

  async setSecretKey(value: string | undefined) {
    if (value) {
      const url = `/store/misc.${value}/secret-key.txt`;
      if (!url) {
        throw new Error('Failed to create secret key validation URL.');
      }

      const result = await fetch(url);
      if (!result.ok) {
        throw new Error('Wrong secret key.');
      }

      const text = await result.text();
      if (text !== value) {
        throw new Error('Wrong secret key test file.');
      }
    }

    setStorageItemWithEvent(localStorage, 'store.secretKey', value ?? null);
  }
}
