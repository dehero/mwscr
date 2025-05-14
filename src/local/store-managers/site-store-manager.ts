import { posix } from 'path';
import { finished } from 'node:stream/promises';
import SFTPClient from 'ssh2-sftp-client';
import { Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { SiteStore } from '../../core/stores/site-store.js';
import { streamToBuffer } from '../utils/data-utils.js';

export class SiteStoreManager extends SiteStore implements StoreManager {
  private client: SFTPClient | undefined;
  private disconnectTimer: NodeJS.Timeout | undefined;

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
      const fromPath = posix.join(site.path, from);
      const toPath = posix.join(site.path, to);

      await site.client.mkdir(posix.dirname(toPath), true);
      await site.client.rcopy(fromPath, toPath);
    } finally {
      this.disconnect();
    }
  }

  async exists(path: string): Promise<boolean> {
    const site = await this.connect();

    try {
      const result = await site.client.exists(posix.join(site.path, path));

      return Boolean(result);
    } finally {
      this.disconnect();
    }
  }

  async get(path: string): Promise<Buffer> {
    const site = await this.connect();

    try {
      const stream = site.client.createReadStream(posix.join(site.path, path));

      return streamToBuffer(stream);
    } finally {
      this.disconnect();
    }
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const site = await this.connect();

    try {
      return site.client.createReadStream(posix.join(site.path, path));
    } finally {
      this.disconnect();
    }
  }

  async move(from: string, to: string): Promise<void> {
    const site = await this.connect();

    try {
      const fromPath = posix.join(site.path, from);
      const toPath = posix.join(site.path, to);

      await site.client.mkdir(posix.dirname(toPath), true);
      await site.client.rename(fromPath, toPath);
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
      const filename = posix.join(site.path, path);
      await site.client.mkdir(posix.dirname(filename), true);

      const writeStream = site.client.createWriteStream(filename);
      stream.pipe(writeStream);
      await finished(writeStream);
    } finally {
      this.disconnect();
    }
  }

  async readdir(path: string): Promise<StoreItem[]> {
    const site = await this.connect();

    try {
      const list = await site.client.list(posix.join(site.path, path));

      return list.map((item) => ({
        name: item.name,
        url: `store:/${posix.join(path, item.name)}`,
        isDirectory: item.type === 'd',
      }));
    } finally {
      this.disconnect();
    }
  }

  async remove(path: string): Promise<void> {
    const site = await this.connect();

    try {
      await site.client.delete(posix.join(site.path, path));
    } finally {
      this.disconnect();
    }
  }
}

export const siteStoreManager = new SiteStoreManager();
