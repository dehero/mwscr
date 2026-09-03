import { posix } from 'path';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import type { StoreItem, StoreManager } from '../../core/entities/store.js';

export class S3StoreManager implements StoreManager {
  readonly name = 'S3';
  // Skip this store when no bucket is configured.
  readonly include = process.env.S3_BUCKET ? undefined : [];

  private client: S3Client | undefined;
  private dirCache: Map<string, StoreItem[]> = new Map();

  private connect() {
    const { S3_BUCKET: bucket, S3_STORE_PATH: storePath = '' } = process.env;
    if (!bucket) {
      throw new Error('Need S3 bucket');
    }

    if (!this.client) {
      const config: S3ClientConfig = {
        region: process.env.S3_REGION || 'us-east-1',
      };

      if (process.env.S3_ENDPOINT) {
        config.endpoint = process.env.S3_ENDPOINT;
        config.forcePathStyle = true;
      }

      if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
        config.credentials = {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        };
      }

      this.client = new S3Client(config);
    }

    return { bucket, path: storePath.replace(/^\/+|\/+$/g, ''), client: this.client };
  }

  private key(path: string) {
    const { path: root } = this.connect();
    return posix.join(root, path).replace(/^\.\//, '');
  }

  private invalidate(...paths: string[]) {
    for (const path of paths) {
      this.dirCache.delete(posix.dirname(path));
      this.dirCache.delete(path);
    }
  }

  async copy(from: string, to: string): Promise<void> {
    const store = this.connect();
    await store.client.send(
      new CopyObjectCommand({
        Bucket: store.bucket,
        CopySource: `${store.bucket}/${this.key(from).split('/').map(encodeURIComponent).join('/')}`,
        Key: this.key(to),
      }),
    );
    this.invalidate(from, to);
  }

  async exists(path: string): Promise<false | StoreItem> {
    const store = this.connect();
    try {
      await store.client.send(new HeadObjectCommand({ Bucket: store.bucket, Key: this.key(path) }));
      return { name: posix.basename(path), url: `store:/${path}`, isDirectory: false };
    } catch {
      try {
        const items = await this.readdir(path);
        return items.length > 0 || path === ''
          ? { name: posix.basename(path), url: `store:/${path}`, isDirectory: true }
          : false;
      } catch {
        return false;
      }
    }
  }

  async get(path: string): Promise<Buffer> {
    const store = this.connect();
    const response = await store.client.send(new GetObjectCommand({ Bucket: store.bucket, Key: this.key(path) }));
    if (!response.Body) {
      throw new Error(`S3 object has no body: ${path}`);
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const store = this.connect();
    const response = await store.client.send(new GetObjectCommand({ Bucket: store.bucket, Key: this.key(path) }));
    return (response.Body as NodeJS.ReadableStream | undefined) ?? null;
  }

  getPublicUrl(path: string): string | undefined {
    const base = process.env.S3_PUBLIC_URL;
    return base ? `${base.replace(/\/$/, '')}/${this.key(path)}` : undefined;
  }

  getPreviewUrl(_path: string, _width?: number, _height?: number): string | undefined {
    return undefined;
  }

  async move(from: string, to: string): Promise<void> {
    await this.copy(from, to);
    await this.remove(from);
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    return this.putStream(path, Readable.from(data));
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    const store = this.connect();
    await new Upload({
      client: store.client,
      params: { Bucket: store.bucket, Key: this.key(path), Body: stream as Readable },
    }).done();
    this.invalidate(path);
  }

  async readdir(path: string): Promise<StoreItem[]> {
    const cached = this.dirCache.get(path);
    if (cached) {
      return cached;
    }

    const store = this.connect();
    const prefix = this.key(path).replace(/\/?$/, '/');
    const result: StoreItem[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await store.client.send(
        new ListObjectsV2Command({
          Bucket: store.bucket,
          Prefix: prefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        }),
      );

      result.push(
        ...(response.CommonPrefixes ?? []).map((item) => {
          const key = item.Prefix?.slice(prefix.length).replace(/\/$/, '') ?? '';
          return { name: key, url: `store:/${posix.join(path, key)}`, isDirectory: true };
        }),
        ...(response.Contents ?? [])
          .filter((item) => item.Key !== prefix)
          .map((item) => {
            const name = item.Key?.slice(prefix.length) ?? '';
            return { name, url: `store:/${posix.join(path, name)}`, isDirectory: false };
          }),
      );
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    this.dirCache.set(path, result);
    return result;
  }

  async remove(path: string): Promise<void> {
    const store = this.connect();
    await store.client.send(new DeleteObjectCommand({ Bucket: store.bucket, Key: this.key(path) }));
    this.invalidate(path);
  }
}
