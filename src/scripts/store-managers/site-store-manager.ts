import { posix } from 'path';
import { finished } from 'node:stream/promises';
import SFTPClient from 'ssh2-sftp-client';
import { Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { AbstractSiteStore } from '../../core/stores/abstract-site-store.js';
import { streamToBuffer } from '../utils/data-utils.js';

export class SiteStoreManager extends AbstractSiteStore implements StoreManager {
  private client: SFTPClient | undefined;
  private disconnectTimer: NodeJS.Timeout | undefined;
  private dirCache: Map<string, StoreItem[]> = new Map();

  protected getSecretKey() {
    return process.env.SITE_STORE_SECRET_KEY;
  }

  private async connect() {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = undefined;
    }

    const { SITE_SSH_HOST, SITE_SSH_USER, SITE_SSH_PRIVATE_KEY, SITE_SSH_STORE_PATH } = process.env;
    if (!SITE_SSH_HOST) {
      throw new Error('Need site SSH host');
    }

    if (!SITE_SSH_USER) {
      throw new Error('Need site SSH user');
    }

    if (!SITE_SSH_PRIVATE_KEY) {
      throw new Error('Need site SSH private key');
    }

    if (!SITE_SSH_STORE_PATH) {
      throw new Error('Need site SSH store path');
    }

    if (!this.client) {
      this.client = new SFTPClient();

      await this.client.connect({
        host: SITE_SSH_HOST,
        username: SITE_SSH_USER,
        privateKey: SITE_SSH_PRIVATE_KEY,
      });
    }

    return { path: SITE_SSH_STORE_PATH, client: this.client };
  }

  private disconnect() {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
    }

    this.disconnectTimer = setTimeout(() => {
      this.client?.end();
      this.client = undefined;
      this.disconnectTimer = undefined;
    }, 1000);
  }

  async copy(from: string, to: string): Promise<void> {
    const site = await this.connect();

    try {
      const fromRealPath = this.toRealPath(from);
      if (!fromRealPath) {
        throw new Error(`Failed to create real path for "${from}".`);
      }

      const toRealPath = this.toRealPath(to);
      if (!toRealPath) {
        throw new Error(`Failed to create real path for "${to}".`);
      }

      const fullFromPath = posix.join(site.path, fromRealPath);
      const fullToPath = posix.join(site.path, toRealPath);

      await site.client.mkdir(posix.dirname(fullToPath), true);
      await site.client.rcopy(fullFromPath, fullToPath);

      this.dirCache.delete(posix.dirname(from));
      this.dirCache.delete(posix.dirname(to));
    } finally {
      this.disconnect();
    }
  }

  async exists(path: string): Promise<false | StoreItem> {
    const { dir, base } = posix.parse(path);
    try {
      const items = await this.readdir(dir);
      return items.find((item) => item.name === base) ?? false;
    } catch {
      return false;
    }
  }

  async get(path: string): Promise<Buffer> {
    const site = await this.connect();

    try {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      const stream = site.client.createReadStream(posix.join(site.path, realPath));
      return streamToBuffer(stream);
    } finally {
      this.disconnect();
    }
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const site = await this.connect();

    try {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      return site.client.createReadStream(posix.join(site.path, realPath));
    } finally {
      this.disconnect();
    }
  }

  async move(from: string, to: string): Promise<void> {
    const site = await this.connect();

    try {
      const fromRealPath = this.toRealPath(from);
      if (!fromRealPath) {
        throw new Error(`Failed to create real path for "${from}".`);
      }

      const toRealPath = this.toRealPath(to);
      if (!toRealPath) {
        throw new Error(`Failed to create real path for "${to}".`);
      }

      const fullFromPath = posix.join(site.path, fromRealPath);
      const fullToPath = posix.join(site.path, toRealPath);

      await site.client.mkdir(posix.dirname(fullToPath), true);
      await site.client.rename(fullFromPath, fullToPath);

      this.dirCache.delete(posix.dirname(fromRealPath));
      this.dirCache.delete(posix.dirname(toRealPath));
    } finally {
      this.disconnect();
    }
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    const stream = Readable.from(data);
    return this.putStream(path, stream);
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    const site = await this.connect();

    try {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      const filename = posix.join(site.path, realPath);
      await site.client.mkdir(posix.dirname(filename), true);

      const writeStream = site.client.createWriteStream(filename);
      stream.pipe(writeStream);
      await finished(writeStream);

      this.dirCache.delete(posix.dirname(path));
    } finally {
      this.disconnect();
    }
  }

  async readdir(path: string): Promise<StoreItem[]> {
    let result = this.dirCache.get(path);
    if (result) {
      return result;
    }

    const site = await this.connect();

    try {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      const list = await site.client.list(posix.join(site.path, realPath));

      result = list.map((item) => ({
        name: item.type === 'd' ? this.unprotectFolderName(item.name) : item.name,
        url: `store:/${posix.join(path, item.name)}`,
        isDirectory: item.type === 'd',
      }));
    } finally {
      this.disconnect();
    }

    this.dirCache.set(path, result);

    return result;
  }

  async remove(path: string): Promise<void> {
    const site = await this.connect();

    try {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      await site.client.delete(posix.join(site.path, realPath));
      this.dirCache.delete(posix.dirname(path));
    } finally {
      this.disconnect();
    }
  }
}
