import { AbstractS3Store } from '../../core/stores/abstract-s3-store.js';
import { setStorageItemWithEvent } from '../utils/storage-utils.js';

export class S3Store extends AbstractS3Store {
  getSecretKey() {
    return localStorage.getItem('store.secretKey') ?? undefined;
  }

  private getUrl(path: string): string | undefined {
    const base = import.meta.env.VITE_S3_PUBLIC_URL;
    if (!base) {
      return undefined;
    }

    const storePath = import.meta.env.VITE_S3_STORE_PATH.replace(/^\/+|\/+$/g, '');
    const key = [storePath, path].filter(Boolean).join('/');
    return new URL(key, `${base.replace(/\/+$/, '')}/`).toString();
  }

  async setSecretKey(value: string | undefined) {
    if (value) {
      const url = this.getUrl(`misc.${value}/secret-key.txt`);
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

  getPublicUrl(path: string): string | undefined {
    const realPath = this.toRealPath(path);
    if (!realPath) {
      return undefined;
    }
    return this.getUrl(realPath);
  }
}
