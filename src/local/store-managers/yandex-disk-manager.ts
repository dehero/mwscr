import 'dotenv/config';
import { posix } from 'path';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import type { PreviewSize } from 'ya-disk';
import yaDisk from 'ya-disk';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';

type FilesResourceList = Awaited<ReturnType<typeof yaDisk.list>> & { total: number };

function diskPathToStoreUrl(path: string) {
  const { YANDEX_DISK_STORE_PATH: storePath } = process.env;

  return path.replace(`disk:/${storePath}`, 'store:/');
}

export class YandexDiskManager implements StoreManager {
  private previewUrlCache: Map<string, string | undefined> = new Map();
  private dirCache: Map<string, StoreItem[]> = new Map();

  private connect() {
    const { YANDEX_DISK_ACCESS_TOKEN: token, YANDEX_DISK_STORE_PATH: path } = process.env;
    if (!token) {
      throw new Error('Need Yandex Disk access token');
    }
    if (!path) {
      throw new Error('Need Yandex Disk store root path');
    }
    return { token, path };
  }

  private async fetchPath(path: string) {
    const store = this.connect();
    const srcPath = posix.join(store.path, path);

    const { href, method } = await yaDisk.download.link(store.token, srcPath);
    return fetch(href, {
      method,
      headers: { Authorization: `OAuth ${store.token}` },
      referrerPolicy: 'no-referrer',
    });
  }

  async copy(from: string, to: string): Promise<void> {
    const { token, path } = this.connect();
    const fromPath = posix.join(path, from);
    const toPath = posix.join(path, to);

    try {
      await yaDisk.resources.copy(token, fromPath, toPath);

      this.dirCache.delete(posix.dirname(from));
      this.dirCache.delete(posix.dirname(to));
    } catch (error) {
      if (error instanceof Error && error.name === 'DiskResourceAlreadyExistsError') {
        await this.remove(to);
        return this.copy(from, to);
      }
      throw error;
    }
  }

  async exists(path: string): Promise<boolean> {
    const { dir, base } = posix.parse(path);
    const items = await this.readdir(dir);

    return Boolean(items.find((item) => item.name === base));
  }

  async get(path: string): Promise<Buffer> {
    const response = await this.fetchPath(path);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const response = await this.fetchPath(path);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.body;
  }

  async getPreviewUrl(path: string, width?: number, height?: number): Promise<string | undefined> {
    const size: PreviewSize = width ? `${width}x${height || ''}` : height ? `${width || ''}x${height}` : 'XXXL';
    const cacheId = `${path}:${size}`;

    const result = this.previewUrlCache.get(cacheId);
    if (result) {
      return result;
    }

    const store = this.connect();

    const resource = await yaDisk.meta.get(store.token, posix.join(store.path, path), {
      limit: 1,
      preview_size: size,
      fields: 'preview',
      preview_crop: false,
    });

    this.previewUrlCache.set(cacheId, resource.preview);

    return resource.preview;
  }

  getPublicUrl(_path: string): string | undefined {
    return undefined;
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    const store = this.connect();
    const srcPath = posix.join(store.path, path);

    const { href, method } = await yaDisk.upload.link(store.token, srcPath, true);
    const response = await fetch(href, {
      method,
      body: stream,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    this.dirCache.delete(posix.dirname(path));
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>) {
    const stream = Readable.from(data);
    return this.putStream(path, stream);
  }

  async move(from: string, to: string): Promise<void> {
    const { token, path } = this.connect();
    const fromPath = posix.join(path, from);
    const toPath = posix.join(path, to);

    try {
      await yaDisk.resources.move(token, fromPath, toPath);

      this.dirCache.delete(posix.dirname(from));
      this.dirCache.delete(posix.dirname(to));
    } catch (error) {
      if (error instanceof Error && error.name === 'DiskResourceAlreadyExistsError') {
        await this.remove(to);
        return this.move(from, to);
      }
      throw error;
    }
  }

  async readdir(path: string): Promise<StoreItem[]> {
    let result = this.dirCache.get(path);
    if (result) {
      return result;
    }

    const store = this.connect();

    result = [];

    const limit = 1000;
    let offset = 0;
    let total = 0;

    do {
      const resource = await yaDisk.meta.get(store.token, posix.join(store.path, path), {
        offset,
        limit,
        sort: 'name',
        fields: '_embedded.items.name,_embedded.items.path,_embedded.items.type,_embedded.total',
      });

      if (!resource._embedded) {
        throw new Error('Unable to read directory');
      }

      const embedded = resource._embedded as unknown as FilesResourceList;

      result.push(
        ...embedded.items.map((item) => ({
          name: item.name,
          url: diskPathToStoreUrl(item.path),
          isDirectory: item.type === 'dir',
        })),
      );

      offset += limit;
      total = embedded.total;
    } while (offset < total);

    this.dirCache.set(path, result);

    return result;
  }

  async remove(path: string): Promise<void> {
    const store = this.connect();

    await yaDisk.resources.remove(store.token, posix.join(store.path, path));

    this.dirCache.delete(posix.dirname(path));

    // TODO: Track operation progress https://yandex.com/dev/disk/api/reference/delete.html
  }
}

export const yandexDiskManager = new YandexDiskManager();
