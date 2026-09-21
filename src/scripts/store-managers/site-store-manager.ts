import { posix } from 'path';
import { finished } from 'node:stream/promises';
import SFTPClient from 'ssh2-sftp-client';
import { Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { AbstractSiteStore } from '../../core/stores/abstract-site-store.js';
import { sleep } from '../../core/utils/common-utils.js';
import { streamToBuffer } from '../utils/data-utils.js';

const OPERATION_ATTEMPTS = 3;
const RETRY_DELAY = 3000;

export class SiteStoreManager extends AbstractSiteStore implements StoreManager {
  private client: SFTPClient | undefined;
  private connecting: Promise<SFTPClient> | undefined;
  private dirCache: Map<string, StoreItem[]> = new Map();

  protected getSecretKey() {
    return process.env.SITE_STORE_SECRET_KEY;
  }

  private async connect() {
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
      if (!this.connecting) {
        this.connecting = this.createClient(SITE_SSH_HOST, SITE_SSH_USER, SITE_SSH_PRIVATE_KEY);
      }

      try {
        this.client = await this.connecting;
      } finally {
        this.connecting = undefined;
      }
    }

    return { path: SITE_SSH_STORE_PATH, client: this.client };
  }

  private async createClient(host: string, username: string, privateKey: string) {
    const client = new SFTPClient();

    // The server may drop the connection at any moment; forget this client so the next operation reconnects.
    client.on('close', () => {
      if (this.client === client) {
        this.client = undefined;
      }
    });

    try {
      await client.connect({ host, username, privateKey });
    } catch (error) {
      await client.end().catch(() => undefined);
      throw error;
    }

    return client;
  }

  private async withClient<T>(operation: (site: { path: string; client: SFTPClient }) => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await operation(await this.connect());
      } catch (error) {
        if (attempt >= OPERATION_ATTEMPTS || !isConnectionError(error)) {
          throw error;
        }

        // The connection is likely broken, drop it to force a reconnect on the next attempt.
        console.warn(`Site store operation failed, retrying in ${RETRY_DELAY}ms... (attempt ${attempt + 1})`);
        this.dropClient();
        await sleep(RETRY_DELAY);
      }
    }
  }

  private dropClient() {
    const client = this.client;
    this.client = undefined;
    this.connecting = undefined;
    client?.end().catch(() => undefined);
  }

  async copy(from: string, to: string): Promise<void> {
    return this.withClient(async (site) => {
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
    });
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
    return this.withClient(async (site) => {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      const stream = site.client.createReadStream(posix.join(site.path, realPath));
      return streamToBuffer(stream);
    });
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    return this.withClient(async (site) => {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      return site.client.createReadStream(posix.join(site.path, realPath));
    });
  }

  async move(from: string, to: string): Promise<void> {
    return this.withClient(async (site) => {
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
    });
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    const stream = Readable.from(data);
    return this.putStream(path, stream);
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    return this.withClient(async (site) => {
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
    });
  }

  async readdir(path: string): Promise<StoreItem[]> {
    let result = this.dirCache.get(path);
    if (result) {
      return result;
    }

    result = await this.withClient(async (site) => {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      const list = await site.client.list(posix.join(site.path, realPath));

      return list.map((item) => ({
        name: item.type === 'd' ? this.unprotectFolderName(item.name) : item.name,
        url: `store:/${posix.join(path, item.name)}`,
        isDirectory: item.type === 'd',
      }));
    });

    this.dirCache.set(path, result);

    return result;
  }

  async remove(path: string): Promise<void> {
    return this.withClient(async (site) => {
      const realPath = this.toRealPath(path);
      if (!realPath) {
        throw new Error(`Failed to create real path for "${path}".`);
      }

      await site.client.delete(posix.join(site.path, realPath));
      this.dirCache.delete(posix.dirname(path));
    });
  }
}

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  switch ((error as NodeJS.ErrnoException).code) {
    case 'ETIMEDOUT':
    case 'ECONNRESET':
    case 'ECONNREFUSED':
    case 'EPIPE':
    case 'EHOSTUNREACH':
    case 'ENETUNREACH':
    case 'ERR_NOT_CONNECTED':
    case 'ERR_GENERIC_CLIENT':
      return true;
    default:
  }

  return /No response from server|No SFTP connection available|Connection lost/.test(error.message);
}
