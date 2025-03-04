import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import { dirname, join as joinPath } from 'path';
import { finished } from 'node:stream/promises';
import { Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { pathExists } from '../utils/file-utils.js';

export class LocalStoreManager implements StoreManager {
  // Skip this store if LOCAL_STORE_PATH is not set
  include = process.env.LOCAL_STORE_PATH ? undefined : [];

  private connect() {
    const { LOCAL_STORE_PATH } = process.env;

    if (!LOCAL_STORE_PATH) {
      throw new Error('Need local store path');
    }

    return { path: LOCAL_STORE_PATH };
  }

  async copy(from: string, to: string): Promise<void> {
    const store = this.connect();
    const fromPath = joinPath(store.path, from);
    const toPath = joinPath(store.path, to);

    await fs.mkdir(dirname(toPath), { recursive: true });
    await fs.copyFile(fromPath, toPath);
  }

  async exists(path: string): Promise<boolean> {
    const store = this.connect();

    return pathExists(joinPath(store.path, path));
  }

  async get(path: string): Promise<Buffer> {
    const store = this.connect();

    return fs.readFile(joinPath(store.path, path));
  }

  getPublicUrl(_path: string): string | undefined {
    return undefined;
  }

  getPreviewUrl(_path: string, _width?: number, _height?: number): string | undefined | Promise<string | undefined> {
    return undefined;
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const store = this.connect();

    return createReadStream(joinPath(store.path, path));
  }

  async move(from: string, to: string): Promise<void> {
    const { path } = this.connect();
    const fromPath = joinPath(path, from);
    const toPath = joinPath(path, to);

    await fs.mkdir(dirname(toPath), { recursive: true });
    await fs.rename(fromPath, toPath);
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    const stream = Readable.from(data);
    return this.putStream(path, stream);
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    const store = this.connect();
    const filename = joinPath(store.path, path);

    await fs.mkdir(dirname(filename), { recursive: true });
    const writeStream = createWriteStream(filename, { flags: 'w' });

    stream.pipe(writeStream);

    return finished(writeStream);
  }

  async readdir(path: string): Promise<StoreItem[]> {
    const store = this.connect();
    const items = await fs.readdir(joinPath(store.path, path), { withFileTypes: true });

    return items.map((item) => ({
      name: item.name,
      url: `store:/${joinPath(path, item.name)}`,
      isDirectory: item.isDirectory(),
    }));
  }

  async remove(path: string): Promise<void> {
    const store = this.connect();

    return fs.unlink(joinPath(store.path, path));
  }
}

export const localStoreManager = new LocalStoreManager();
