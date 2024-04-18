import 'dotenv/config';
import { posix } from 'path';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import type { PreviewSize } from 'ya-disk';
import yaDisk from 'ya-disk';
import type { StoreItem } from '../../core/entities/store.js';

type FilesResourceList = Awaited<ReturnType<typeof yaDisk.list>>;

const previewUrlCache: Map<string, string | undefined> = new Map();
const dirCache: Map<string, StoreItem[]> = new Map();

function diskPathToStoreUrl(path: string) {
  const { YANDEX_DISK_STORE_PATH: storePath } = process.env;

  return path.replace(`disk:/${storePath}`, 'store:/');
}

async function fetchPath(path: string) {
  const store = connect();
  const srcPath = posix.join(store.path, path);

  const { href, method } = await yaDisk.download.link(store.token, srcPath);
  return fetch(href, {
    method,
    headers: { Authorization: `OAuth ${store.token}` },
    referrerPolicy: 'no-referrer',
  });
}

export function connect() {
  const { YANDEX_DISK_ACCESS_TOKEN: token, YANDEX_DISK_STORE_PATH: path } = process.env;
  if (!token) {
    throw new Error('Need Yandex Disk access token');
  }
  if (!path) {
    throw new Error('Need Yandex Disk store root path');
  }
  return { token, path };
}

export async function copy(from: string, to: string) {
  const { token, path } = connect();
  const fromPath = posix.join(path, from);
  const toPath = posix.join(path, to);

  try {
    await yaDisk.resources.copy(token, fromPath, toPath);
  } catch (error) {
    if (error instanceof Error && error.name === 'DiskResourceAlreadyExistsError') {
      await remove(to);
      return copy(from, to);
    }
    throw error;
  }
}

export async function exists(path: string): Promise<boolean> {
  const { dir, base } = posix.parse(path);
  const items = await readdir(dir);

  return Boolean(items.find((item) => item.name === base));
}

export async function get(path: string): Promise<Buffer> {
  const response = await fetchPath(path);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function getStream(path: string): Promise<NodeJS.ReadableStream | null> {
  const response = await fetchPath(path);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.body;
}

export async function getPreviewUrl(path: string, width?: number, height?: number): Promise<string | undefined> {
  const size: PreviewSize = width ? `${width}x${height || ''}` : height ? `${width || ''}x${height}` : 'XXXL';
  const cacheId = `${path}:${size}`;

  const result = previewUrlCache.get(cacheId);
  if (result) {
    return result;
  }

  const store = connect();

  const resource = await yaDisk.meta.get(store.token, posix.join(store.path, path), {
    limit: 1,
    preview_size: size,
    fields: 'preview',
    preview_crop: false,
  });

  previewUrlCache.set(cacheId, resource.preview);

  return resource.preview;
}

export async function getPublicUrl(_path: string): Promise<string | undefined> {
  return undefined;
}

export async function putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
  const store = connect();
  const srcPath = posix.join(store.path, path);

  const { href, method } = await yaDisk.upload.link(store.token, srcPath, true);
  const response = await fetch(href, {
    method,
    body: stream,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>) {
  const stream = Readable.from(data);
  return putStream(path, stream);
}

export async function move(from: string, to: string) {
  const { token, path } = connect();
  const fromPath = posix.join(path, from);
  const toPath = posix.join(path, to);

  try {
    await yaDisk.resources.move(token, fromPath, toPath);
  } catch (error) {
    if (error instanceof Error && error.name === 'DiskResourceAlreadyExistsError') {
      await remove(to);
      return move(from, to);
    }
    throw error;
  }
}

export async function readdir(path: string): Promise<StoreItem[]> {
  let result = dirCache.get(path);
  if (result) {
    return result;
  }

  const store = connect();

  const resource = await yaDisk.meta.get(store.token, posix.join(store.path, path), {
    // TODO: implement pagination
    limit: 1000,
    sort: 'name',
    fields: '_embedded.items.name,_embedded.items.path,_embedded.items.type',
  });

  if (!resource._embedded) {
    return [];
  }

  const { items } = resource._embedded as unknown as FilesResourceList;

  result = items.map((item) => ({
    name: item.name,
    url: diskPathToStoreUrl(item.path),
    isDirectory: item.type === 'dir',
  }));

  dirCache.set(path, result);

  return result;
}

export async function remove(path: string): Promise<void> {
  const store = connect();

  await yaDisk.resources.remove(store.token, posix.join(store.path, path));

  // TODO: Track operation progress https://yandex.com/dev/disk/api/reference/delete.html
}
