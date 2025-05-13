import { posix } from 'path';
import { finished } from 'node:stream/promises';
import { NodeSSH } from 'node-ssh';
import { Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { SiteStore } from '../../core/stores/site-store.js';
import { debounce } from '../../core/utils/common-utils.js';
import { streamToBuffer } from '../utils/data-utils.js';

export class SiteStoreManager extends SiteStore implements StoreManager {
  client: NodeSSH | undefined;

  private waitAndClose = debounce(() => this.client?.dispose(), 1000);

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
      this.client = new NodeSSH();
    }

    if (!this.client.isConnected()) {
      await this.client.connect({
        host: SITE_SSH_HOST,
        username: SITE_SSH_USER,
        privateKey: SITE_SSH_PRIVATE_KEY,
      });
    }

    return { client: this.client, path: SITE_SSH_STORE_PATH };
  }

  async copy(from: string, to: string): Promise<void> {
    try {
      const { client, path } = await this.connect();
      const fromPath = posix.join(path, from);
      const toPath = posix.join(path, to);

      await client.mkdir(posix.dirname(toPath));

      const response = await client.execCommand(`cp -r ${fromPath} ${toPath}`);

      if (response.code !== 0) {
        throw new Error(response.stderr);
      }
    } finally {
      this.waitAndClose();
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const site = await this.connect();
      const sftp = await site.client.requestSFTP();

      return new Promise((resolve) => sftp.exists(posix.join(site.path, path), (result) => resolve(result)));
    } finally {
      this.waitAndClose();
    }
  }

  async get(path: string): Promise<Buffer> {
    try {
      const site = await this.connect();
      const sftp = await site.client.requestSFTP();
      const stream = sftp.createReadStream(posix.join(site.path, path));

      return streamToBuffer(stream);
    } finally {
      this.waitAndClose();
    }
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    try {
      const site = await this.connect();
      const sftp = await site.client.requestSFTP();

      return sftp.createReadStream(posix.join(site.path, path));
    } finally {
      this.waitAndClose();
    }
  }

  async move(from: string, to: string): Promise<void> {
    try {
      const { client, path } = await this.connect();
      const fromPath = posix.join(path, from);
      const toPath = posix.join(path, to);
      const sftp = await client.requestSFTP();

      await client.mkdir(posix.dirname(toPath));

      return new Promise((resolve, reject) => sftp.rename(fromPath, toPath, (err) => (err ? reject(err) : resolve())));
    } finally {
      this.waitAndClose();
    }
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    const stream = Readable.from(data);

    try {
      return this.putStream(path, stream);
    } finally {
      this.waitAndClose();
    }
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    try {
      const site = await this.connect();
      const sftp = await site.client.requestSFTP();

      const filename = posix.join(site.path, path);
      await site.client.mkdir(posix.dirname(filename));

      const writeStream = sftp.createWriteStream(filename);
      stream.pipe(writeStream);

      return finished(writeStream);
    } finally {
      this.waitAndClose();
    }
  }

  async readdir(path: string): Promise<StoreItem[]> {
    try {
      const site = await this.connect();
      const sftp = await site.client.requestSFTP();

      return new Promise((resolve, reject) => {
        sftp.readdir(posix.join(site.path, path), (err, list) => {
          if (err) reject(err);
          resolve(
            list.map((item) => ({
              name: item.filename,
              url: `store:/${posix.join(path, item.filename)}`,
              isDirectory: item.longname.startsWith('d'),
            })),
          );
        });
      });
    } finally {
      this.waitAndClose();
    }
  }

  async remove(path: string): Promise<void> {
    try {
      const site = await this.connect();
      const sftp = await site.client.requestSFTP();

      return new Promise((resolve, reject) => {
        sftp.unlink(posix.join(site.path, path), (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    } finally {
      this.waitAndClose();
    }
  }
}

export const siteStoreManager = new SiteStoreManager();
