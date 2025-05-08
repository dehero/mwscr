import { posix } from 'path';
import { Client } from 'basic-ftp';
import { Duplex, Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { SiteStore } from '../../core/stores/site-store.js';
import { debounce } from '../../core/utils/common-utils.js';
import { streamToBuffer } from '../utils/data-utils.js';

const RETRY_COUNT = 5;

export class SiteStoreManager extends SiteStore implements StoreManager {
  client: Client | undefined;

  private waitAndClose = debounce(() => this.client?.close(), 1000);

  private async retry(method: () => Promise<void>): Promise<void> {
    for (let i = 0; i < RETRY_COUNT; i++) {
      try {
        await method();
        return;
      } catch (error) {
        if (i === RETRY_COUNT - 1) {
          throw error;
        }
      }
    }
  }

  private async connect() {
    const { SITE_FTP_HOST, SITE_FTP_USER, SITE_FTP_PASSWORD, SITE_FTP_STORE_PATH } = process.env;
    if (!SITE_FTP_HOST) {
      throw new Error('Need site FTP host');
    }

    if (!SITE_FTP_USER) {
      throw new Error('Need site FTP user');
    }

    if (!SITE_FTP_PASSWORD) {
      throw new Error('Need site FTP password');
    }

    if (!SITE_FTP_STORE_PATH) {
      throw new Error('Need site FTP store path');
    }

    if (!this.client) {
      this.client = new Client();
    }

    if (this.client.closed) {
      await this.client.access({
        host: SITE_FTP_HOST,
        user: SITE_FTP_USER,
        password: SITE_FTP_PASSWORD,
      });
    }

    return { client: this.client, path: SITE_FTP_STORE_PATH };
  }

  async copy(from: string, to: string): Promise<void> {
    return this.retry(async () => {
      try {
        const { client, path } = await this.connect();
        const fromPath = posix.join(path, from);
        const toPath = posix.join(path, to);

        const stream = new Duplex();

        await client.downloadTo(stream, fromPath);
        await client.ensureDir(posix.dirname(toPath));
        await client.cd('/');
        await client.uploadFrom(stream, toPath);
      } finally {
        this.waitAndClose();
      }
    });
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { dir, base } = posix.parse(path);
      const items = await this.readdir(dir);

      return Boolean(items.find((item) => item.name === base));
    } finally {
      this.waitAndClose();
    }
  }

  async get(path: string): Promise<Buffer> {
    try {
      const site = await this.connect();
      const stream = new Duplex();

      await site.client.downloadTo(stream, posix.join(site.path, path));

      return await streamToBuffer(stream);
    } finally {
      this.waitAndClose();
    }
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    try {
      const site = await this.connect();
      const stream = new Duplex();

      await site.client.downloadTo(stream, posix.join(site.path, path));

      return stream;
    } finally {
      this.waitAndClose();
    }
  }

  async move(from: string, to: string): Promise<void> {
    return this.retry(async () => {
      try {
        const { client, path } = await this.connect();
        const fromPath = posix.join(path, from);
        const toPath = posix.join(path, to);

        await client.ensureDir(posix.dirname(toPath));
        await client.cd('/');
        await client.rename(fromPath, toPath);
      } finally {
        this.waitAndClose();
      }
    });
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    return this.retry(async () => {
      const stream = Readable.from(data);

      try {
        return this.putStream(path, stream);
      } finally {
        this.waitAndClose();
      }
    });
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    return this.retry(async () => {
      try {
        const site = await this.connect();
        const filename = posix.join(site.path, path);

        await site.client.ensureDir(posix.dirname(filename));
        await site.client.cd('/');
        await site.client.uploadFrom(new Readable().wrap(stream), filename);
      } finally {
        this.waitAndClose();
      }
    });
  }

  async readdir(path: string): Promise<StoreItem[]> {
    try {
      const site = await this.connect();
      const items = await site.client.list(posix.join(site.path, path));

      return items.map((item) => ({
        name: item.name,
        url: `store:/${posix.join(path, item.name)}`,
        isDirectory: item.isDirectory,
      }));
    } finally {
      this.waitAndClose();
    }
  }

  async remove(path: string): Promise<void> {
    return this.retry(async () => {
      try {
        const site = await this.connect();

        await site.client.remove(posix.join(site.path, path));
      } finally {
        this.waitAndClose();
      }
    });
  }
}

export const siteStoreManager = new SiteStoreManager();
