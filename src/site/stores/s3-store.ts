import type { Store } from '../../core/entities/store.js';
import { createS3PublicUrl } from './s3-url.js';

export class S3Store implements Store {
  readonly name = 'S3';

  getPublicUrl(path: string): string | undefined {
    const base = import.meta.env.VITE_S3_PUBLIC_URL;
    if (!base) {
      return undefined;
    }

    return createS3PublicUrl(base, import.meta.env.VITE_S3_STORE_PATH, path);
  }

  getPreviewUrl(_path: string, _width?: number, _height?: number): string | undefined {
    return undefined;
  }
}
